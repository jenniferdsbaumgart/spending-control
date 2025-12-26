"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canEdit } from "@/server/access";
import {
    createInstallmentPlan,
    getInstallmentPlanWithDetails,
    markInstallmentAsPosted,
    getUpcomingInstallments,
} from "@/domain/installments";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse, InstallmentPlanWithDetails } from "@/types";

const createInstallmentSchema = z.object({
    description: z.string().min(1, "Description is required").max(200),
    merchant: z.string().max(100).optional(),
    totalAmount: z.number().positive("Total amount must be positive"),
    installmentsCount: z.number().int().min(2, "Minimum 2 installments").max(48, "Maximum 48 installments"),
    firstDueDate: z.coerce.date(),
    accountId: z.string().min(1, "Account is required"),
    categoryId: z.string().min(1, "Category is required"),
});

/**
 * Get all installment plans
 */
export async function getInstallmentPlans(
    workspaceId: string
): Promise<ActionResponse<InstallmentPlanWithDetails[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const plans = await prisma.installmentPlan.findMany({
            where: { workspaceId, isActive: true },
            include: {
                transactions: {
                    orderBy: { installmentNumber: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const mapped: InstallmentPlanWithDetails[] = plans.map((plan) => {
            const transactions = plan.transactions.map((t) => ({
                id: t.id,
                date: t.date,
                amount: t.amount.toNumber(),
                status: t.status,
                installmentNumber: t.installmentNumber ?? 0,
            }));

            const paidCount = transactions.filter((t) => t.status === "POSTED").length;
            const plannedTransactions = transactions.filter((t) => t.status === "PLANNED");
            const nextDueDate = plannedTransactions.length > 0 ? plannedTransactions[0].date : null;

            return {
                id: plan.id,
                description: plan.description,
                merchant: plan.merchant,
                totalAmount: plan.totalAmount.toNumber(),
                installmentsCount: plan.installmentsCount,
                firstDueDate: plan.firstDueDate,
                isActive: plan.isActive,
                accountId: plan.accountId,
                categoryId: plan.categoryId,
                paidCount,
                remainingCount: plan.installmentsCount - paidCount,
                nextDueDate,
                transactions,
            };
        });

        return { success: true, data: mapped };
    } catch (error) {
        console.error("Error getting installment plans:", error);
        return { success: false, error: "Failed to get installment plans" };
    }
}

/**
 * Get a single installment plan with details
 */
export async function getInstallmentPlan(
    workspaceId: string,
    planId: string
): Promise<ActionResponse<InstallmentPlanWithDetails>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const plan = await getInstallmentPlanWithDetails(planId, workspaceId);
        if (!plan) {
            return { success: false, error: "Installment plan not found" };
        }

        return { success: true, data: plan };
    } catch (error) {
        console.error("Error getting installment plan:", error);
        return { success: false, error: "Failed to get installment plan" };
    }
}

/**
 * Create a new installment plan
 */
export async function createInstallment(
    workspaceId: string,
    data: z.infer<typeof createInstallmentSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = createInstallmentSchema.parse(data);

        // Verify account and category belong to workspace
        const [account, category] = await Promise.all([
            prisma.financialAccount.findFirst({
                where: { id: validated.accountId, workspaceId },
            }),
            prisma.budgetCategory.findFirst({
                where: { id: validated.categoryId, workspaceId },
            }),
        ]);

        if (!account) {
            return { success: false, error: "Account not found" };
        }
        if (!category) {
            return { success: false, error: "Category not found" };
        }

        const planId = await createInstallmentPlan({
            workspaceId,
            description: validated.description,
            merchant: validated.merchant,
            totalAmount: validated.totalAmount,
            installmentsCount: validated.installmentsCount,
            firstDueDate: validated.firstDueDate,
            accountId: validated.accountId,
            categoryId: validated.categoryId,
        });

        revalidatePath(`/app/${workspaceId}/installments`);
        return { success: true, data: { id: planId } };
    } catch (error) {
        console.error("Error creating installment:", error);
        return { success: false, error: "Failed to create installment" };
    }
}

/**
 * Mark an installment transaction as posted (paid)
 */
export async function postInstallment(
    workspaceId: string,
    transactionId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        await markInstallmentAsPosted(transactionId, workspaceId);

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error posting installment:", error);
        return { success: false, error: "Failed to post installment" };
    }
}

/**
 * Get upcoming installments
 */
export async function getUpcoming(
    workspaceId: string,
    limit: number = 10
) {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const upcoming = await getUpcomingInstallments(workspaceId, limit);

        return {
            success: true,
            data: upcoming.map((t) => ({
                id: t.id,
                date: t.date,
                amount: t.amount.toNumber(),
                description: t.installmentPlan?.description ?? t.description,
                installmentNumber: t.installmentNumber,
                totalInstallments: t.installmentPlan?.installmentsCount,
                accountName: t.account.name,
                categoryName: t.category?.name,
            })),
        };
    } catch (error) {
        console.error("Error getting upcoming installments:", error);
        return { success: false, error: "Failed to get upcoming installments" };
    }
}

/**
 * Cancel an installment plan (deactivate)
 */
export async function cancelInstallmentPlan(
    workspaceId: string,
    planId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        // Soft delete the plan and void remaining planned transactions
        await prisma.$transaction([
            prisma.installmentPlan.updateMany({
                where: { id: planId, workspaceId },
                data: { isActive: false },
            }),
            prisma.transaction.updateMany({
                where: {
                    installmentPlanId: planId,
                    status: "PLANNED",
                },
                data: { status: "VOID" },
            }),
        ]);

        revalidatePath(`/app/${workspaceId}/installments`);
        return { success: true };
    } catch (error) {
        console.error("Error canceling installment plan:", error);
        return { success: false, error: "Failed to cancel installment plan" };
    }
}
