import { Header } from "@/components/layout/header";
import { getTransactions } from "@/server/actions/transactions";
import { getAccounts } from "@/server/actions/accounts";
import { getBudgetGroups } from "@/server/actions/budgets";
import { getCurrentMonthKey } from "@/lib/date";
import { TransactionsClient } from "./client";

export default async function TransactionsPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const resolvedParams = await params;
    const { workspaceId } = resolvedParams;
    const currentMonth = getCurrentMonthKey();

    const [transactionsResult, accountsResult, budgetGroupsResult] = await Promise.all([
        getTransactions(workspaceId, currentMonth),
        getAccounts(workspaceId),
        getBudgetGroups(workspaceId),
    ]);

    const transactions = transactionsResult.success ? transactionsResult.data ?? [] : [];
    const accounts = accountsResult.success ? accountsResult.data ?? [] : [];
    const budgetGroups = budgetGroupsResult.success ? budgetGroupsResult.data ?? [] : [];

    return (
        <TransactionsClient
            workspaceId={workspaceId}
            initialTransactions={transactions}
            accounts={accounts}
            budgetGroups={budgetGroups}
        />
    );
}
