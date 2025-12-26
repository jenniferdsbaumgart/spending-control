/**
 * Budget Domain Service
 *
 * Handles budget calculations, monthly plan snapshots, and budget vs actual computations.
 */

import { prisma } from "@/db/prisma";
import { getMonthDateRange } from "@/lib/date";
import type { MonthlyBudgetSummary } from "@/types";

/**
 * Ensure a monthly budget plan exists for the given month.
 * If not, create it by copying default percentages from budget groups.
 */
export async function ensureMonthlyPlanExists(
    workspaceId: string,
    yearMonth: string
): Promise<string> {
    // Check if plan already exists
    const existingPlan = await prisma.monthlyBudgetPlan.findUnique({
        where: {
            workspaceId_yearMonth: {
                workspaceId,
                yearMonth,
            },
        },
    });

    if (existingPlan) {
        return existingPlan.id;
    }

    // Get all active budget groups with their default percentages
    const groups = await prisma.budgetGroup.findMany({
        where: {
            workspaceId,
            isActive: true,
        },
        orderBy: { sortOrder: "asc" },
    });

    // Create the plan with allocations
    const plan = await prisma.monthlyBudgetPlan.create({
        data: {
            workspaceId,
            yearMonth,
            allocations: {
                create: groups.map((group) => ({
                    groupId: group.id,
                    percentSnapshot: group.defaultPercent,
                })),
            },
        },
    });

    return plan.id;
}

/**
 * Get or create monthly budget allocations
 */
export async function getMonthlyAllocations(
    workspaceId: string,
    yearMonth: string
) {
    await ensureMonthlyPlanExists(workspaceId, yearMonth);

    const plan = await prisma.monthlyBudgetPlan.findUnique({
        where: {
            workspaceId_yearMonth: {
                workspaceId,
                yearMonth,
            },
        },
        include: {
            allocations: {
                include: {
                    group: true,
                },
            },
        },
    });

    return plan?.allocations ?? [];
}

/**
 * Update monthly allocation for a specific group
 */
export async function updateMonthlyAllocation(
    workspaceId: string,
    yearMonth: string,
    groupId: string,
    newPercent: number
) {
    const planId = await ensureMonthlyPlanExists(workspaceId, yearMonth);

    await prisma.monthlyGroupAllocation.upsert({
        where: {
            planId_groupId: {
                planId,
                groupId,
            },
        },
        update: {
            percentSnapshot: newPercent,
        },
        create: {
            planId,
            groupId,
            percentSnapshot: newPercent,
        },
    });
}

/**
 * Compute the total income for a month
 */
export async function computeIncomeTotal(
    workspaceId: string,
    yearMonth: string
): Promise<number> {
    const { start, end } = getMonthDateRange(yearMonth);

    const result = await prisma.transaction.aggregate({
        where: {
            workspaceId,
            type: "INCOME",
            status: "POSTED",
            date: {
                gte: start,
                lte: end,
            },
        },
        _sum: {
            amount: true,
        },
    });

    return result._sum.amount?.toNumber() ?? 0;
}

/**
 * Compute the total expenses for a month
 */
export async function computeExpenseTotal(
    workspaceId: string,
    yearMonth: string
): Promise<number> {
    const { start, end } = getMonthDateRange(yearMonth);

    const result = await prisma.transaction.aggregate({
        where: {
            workspaceId,
            type: "EXPENSE",
            status: "POSTED",
            date: {
                gte: start,
                lte: end,
            },
        },
        _sum: {
            amount: true,
        },
    });

    return result._sum.amount?.toNumber() ?? 0;
}

/**
 * Compute spending per group for a month
 */
export async function computeSpendingByGroup(
    workspaceId: string,
    yearMonth: string
): Promise<Map<string, number>> {
    const { start, end } = getMonthDateRange(yearMonth);

    const spending = await prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
            workspaceId,
            type: "EXPENSE",
            status: "POSTED",
            date: {
                gte: start,
                lte: end,
            },
            categoryId: {
                not: null,
            },
        },
        _sum: {
            amount: true,
        },
    });

    // Get category to group mapping
    const categories = await prisma.budgetCategory.findMany({
        where: { workspaceId },
        select: { id: true, groupId: true },
    });

    const categoryToGroup = new Map(
        categories.map((c) => [c.id, c.groupId])
    );

    // Aggregate by group
    const groupSpending = new Map<string, number>();

    for (const item of spending) {
        if (item.categoryId) {
            const groupId = categoryToGroup.get(item.categoryId);
            if (groupId) {
                const current = groupSpending.get(groupId) ?? 0;
                groupSpending.set(
                    groupId,
                    current + (item._sum.amount?.toNumber() ?? 0)
                );
            }
        }
    }

    return groupSpending;
}

/**
 * Compute complete budget summary for all groups
 */
export async function computeGroupBudgets(
    workspaceId: string,
    yearMonth: string
): Promise<MonthlyBudgetSummary[]> {
    // Ensure plan exists and get allocations
    const allocations = await getMonthlyAllocations(workspaceId, yearMonth);

    // Get income total
    const incomeTotal = await computeIncomeTotal(workspaceId, yearMonth);

    // Get spending by group
    const spendingByGroup = await computeSpendingByGroup(workspaceId, yearMonth);

    // Build summary for each group
    const summaries: MonthlyBudgetSummary[] = allocations.map((allocation) => {
        const percentAllocation = allocation.percentSnapshot.toNumber();
        const budgetAmount = (incomeTotal * percentAllocation) / 100;
        const spentAmount = spendingByGroup.get(allocation.groupId) ?? 0;
        const remainingAmount = budgetAmount - spentAmount;

        return {
            groupId: allocation.groupId,
            groupName: allocation.group.name,
            groupColor: allocation.group.color,
            percentAllocation,
            budgetAmount,
            spentAmount,
            remainingAmount,
        };
    });

    return summaries;
}

/**
 * Check if percentages sum to 100%
 */
export function validatePercentages(
    percentages: number[]
): { valid: boolean; total: number } {
    const total = percentages.reduce((sum, p) => sum + p, 0);
    // Allow small floating point errors
    const valid = Math.abs(total - 100) < 0.01;
    return { valid, total: Math.round(total * 100) / 100 };
}

/**
 * Round a budget amount to 2 decimal places
 */
export function roundBudget(amount: number): number {
    return Math.round(amount * 100) / 100;
}
