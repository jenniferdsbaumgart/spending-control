/**
 * Installments Domain Service
 *
 * Handles installment plan creation and transaction generation.
 */

import { prisma } from "@/db/prisma";
import { addMonths } from "date-fns";
import { distributeAmount } from "@/lib/currency";
import type { InstallmentPlanWithDetails, InstallmentTransactionInfo } from "@/types";

interface GenerateInstallmentsInput {
    workspaceId: string;
    description: string;
    merchant?: string;
    totalAmount: number;
    installmentsCount: number;
    firstDueDate: Date;
    accountId: string;
    categoryId: string;
}

/**
 * Create an installment plan and generate PLANNED transactions
 */
export async function createInstallmentPlan(
    input: GenerateInstallmentsInput
): Promise<string> {
    const {
        workspaceId,
        description,
        merchant,
        totalAmount,
        installmentsCount,
        firstDueDate,
        accountId,
        categoryId,
    } = input;

    // Distribute amount across installments with proper rounding
    const amounts = distributeAmount(totalAmount, installmentsCount);

    // Create plan and transactions in a transaction
    const plan = await prisma.$transaction(async (tx) => {
        // Create the installment plan
        const installmentPlan = await tx.installmentPlan.create({
            data: {
                workspaceId,
                description,
                merchant,
                totalAmount,
                installmentsCount,
                firstDueDate,
                accountId,
                categoryId,
            },
        });

        // Generate transactions for each installment
        const transactions = amounts.map((amount, index) => ({
            workspaceId,
            date: addMonths(firstDueDate, index),
            amount,
            type: "EXPENSE" as const,
            description: `${description} (${index + 1}/${installmentsCount})`,
            status: "PLANNED" as const,
            accountId,
            categoryId,
            installmentPlanId: installmentPlan.id,
            installmentNumber: index + 1,
        }));

        await tx.transaction.createMany({
            data: transactions,
        });

        return installmentPlan;
    });

    return plan.id;
}

/**
 * Get installment plan with details and transactions
 */
export async function getInstallmentPlanWithDetails(
    planId: string,
    workspaceId: string
): Promise<InstallmentPlanWithDetails | null> {
    const plan = await prisma.installmentPlan.findFirst({
        where: {
            id: planId,
            workspaceId,
        },
        include: {
            transactions: {
                orderBy: { installmentNumber: "asc" },
            },
        },
    });

    if (!plan) return null;

    const transactions: InstallmentTransactionInfo[] = plan.transactions.map((t) => ({
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
}

/**
 * Mark an installment as posted (paid)
 */
export async function markInstallmentAsPosted(
    transactionId: string,
    workspaceId: string
): Promise<void> {
    await prisma.transaction.updateMany({
        where: {
            id: transactionId,
            workspaceId,
            status: "PLANNED",
        },
        data: {
            status: "POSTED",
        },
    });
}

/**
 * Get all upcoming installments (PLANNED) for a workspace
 */
export async function getUpcomingInstallments(
    workspaceId: string,
    limit: number = 10
) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.transaction.findMany({
        where: {
            workspaceId,
            status: "PLANNED",
            installmentPlanId: { not: null },
            date: { gte: today },
        },
        include: {
            installmentPlan: true,
            account: true,
            category: {
                include: { group: true },
            },
        },
        orderBy: { date: "asc" },
        take: limit,
    });
}
