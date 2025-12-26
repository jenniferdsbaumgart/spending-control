"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canEdit } from "@/server/access";
import { getMonthDateRange } from "@/lib/date";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse, TransactionWithRelations, TransactionFilters } from "@/types";

const createTransactionSchema = z.object({
    date: z.coerce.date(),
    amount: z.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    description: z.string().optional(),
    accountId: z.string().min(1, "Account is required"),
    categoryId: z.string().optional(),
    status: z.enum(["POSTED", "PLANNED"]).default("POSTED"),
});

const updateTransactionSchema = createTransactionSchema.partial();

/**
 * Get transactions for a month
 */
export async function getTransactions(
    workspaceId: string,
    monthKey: string,
    filters?: TransactionFilters
): Promise<ActionResponse<TransactionWithRelations[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const { start, end } = getMonthDateRange(monthKey);

        const where: Record<string, unknown> = {
            workspaceId,
            date: { gte: start, lte: end },
            status: { not: "VOID" },
        };

        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters?.accountId) {
            where.accountId = filters.accountId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.search) {
            where.description = { contains: filters.search, mode: "insensitive" };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                account: {
                    select: { id: true, name: true, type: true },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                        group: {
                            select: { id: true, name: true, color: true },
                        },
                    },
                },
                installmentPlan: {
                    select: { id: true, description: true, installmentsCount: true },
                },
            },
            orderBy: { date: "desc" },
        });

        const mapped: TransactionWithRelations[] = transactions.map((t) => ({
            id: t.id,
            date: t.date,
            amount: t.amount.toNumber(),
            type: t.type,
            description: t.description,
            status: t.status,
            account: t.account,
            category: t.category,
            installmentPlan: t.installmentPlan,
            installmentNumber: t.installmentNumber,
        }));

        return { success: true, data: mapped };
    } catch (error) {
        console.error("Error getting transactions:", error);
        return { success: false, error: "Failed to get transactions" };
    }
}

/**
 * Create a new transaction
 */
export async function createTransaction(
    workspaceId: string,
    data: z.infer<typeof createTransactionSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = createTransactionSchema.parse(data);

        // Validate category for EXPENSE type
        if (validated.type === "EXPENSE" && !validated.categoryId) {
            return { success: false, error: "Category is required for expenses" };
        }

        const transaction = await prisma.transaction.create({
            data: {
                workspaceId,
                date: validated.date,
                amount: validated.amount,
                type: validated.type,
                description: validated.description,
                accountId: validated.accountId,
                categoryId: validated.categoryId,
                status: validated.status,
            },
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true, data: { id: transaction.id } };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error: "Failed to create transaction" };
    }
}

/**
 * Update a transaction
 */
export async function updateTransaction(
    workspaceId: string,
    transactionId: string,
    data: z.infer<typeof updateTransactionSchema>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = updateTransactionSchema.parse(data);

        // Verify transaction belongs to workspace
        const existing = await prisma.transaction.findFirst({
            where: { id: transactionId, workspaceId },
        });

        if (!existing) {
            return { success: false, error: "Transaction not found" };
        }

        await prisma.transaction.update({
            where: { id: transactionId },
            data: validated,
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating transaction:", error);
        return { success: false, error: "Failed to update transaction" };
    }
}

/**
 * Delete a transaction (soft delete by setting status to VOID)
 */
export async function deleteTransaction(
    workspaceId: string,
    transactionId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        // Verify transaction belongs to workspace
        const existing = await prisma.transaction.findFirst({
            where: { id: transactionId, workspaceId },
        });

        if (!existing) {
            return { success: false, error: "Transaction not found" };
        }

        // Soft delete
        await prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "VOID" },
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return { success: false, error: "Failed to delete transaction" };
    }
}
