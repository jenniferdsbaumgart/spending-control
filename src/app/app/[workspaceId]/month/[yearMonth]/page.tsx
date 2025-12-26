import { computeMonthSummary } from "@/domain/summary";
import { ensureMonthlyPlanExists } from "@/domain/budget";
import { getAccounts } from "@/server/actions/accounts";
import { getBudgetGroups } from "@/server/actions/budgets";
import { MonthDashboardClient } from "./client";

export default async function MonthDashboardPage({
    params,
}: {
    params: Promise<{ workspaceId: string; yearMonth: string }>;
}) {
    const resolvedParams = await params;
    const { workspaceId, yearMonth } = resolvedParams;

    // Ensure monthly plan exists (creates snapshot if first access)
    await ensureMonthlyPlanExists(workspaceId, yearMonth);

    // Fetch all data in parallel
    const [summary, accountsResult, budgetGroupsResult] = await Promise.all([
        computeMonthSummary(workspaceId, yearMonth),
        getAccounts(workspaceId),
        getBudgetGroups(workspaceId),
    ]);

    const accounts = accountsResult.success ? accountsResult.data ?? [] : [];
    const budgetGroups = budgetGroupsResult.success ? budgetGroupsResult.data ?? [] : [];

    return (
        <MonthDashboardClient
            workspaceId={workspaceId}
            yearMonth={yearMonth}
            summary={summary}
            accounts={accounts}
            budgetGroups={budgetGroups}
        />
    );
}
