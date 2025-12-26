/**
 * Monthly Summary Domain Service
 *
 * Provides aggregated financial summaries for a month.
 */

import { computeIncomeTotal, computeExpenseTotal, computeGroupBudgets } from "./budget";
import type { MonthSummary } from "@/types";

/**
 * Compute complete month summary including income, expenses, balance, and budget groups
 */
export async function computeMonthSummary(
    workspaceId: string,
    monthKey: string
): Promise<MonthSummary> {
    // Run queries in parallel for performance
    const [incomeTotal, expenseTotal, budgetGroups] = await Promise.all([
        computeIncomeTotal(workspaceId, monthKey),
        computeExpenseTotal(workspaceId, monthKey),
        computeGroupBudgets(workspaceId, monthKey),
    ]);

    const balance = incomeTotal - expenseTotal;

    return {
        monthKey,
        incomeTotal,
        expenseTotal,
        balance,
        budgetGroups,
    };
}
