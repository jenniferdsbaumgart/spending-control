import { getTransactions } from "@/server/actions/transactions";
import { getAccounts } from "@/server/actions/accounts";
import { getBudgetGroups } from "@/server/actions/budgets";
import { getIncomeCategories } from "@/server/actions/income-categories";
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

    const [transactionsResult, accountsResult, budgetGroupsResult, incomeCategoriesResult] = await Promise.all([
        getTransactions(workspaceId, currentMonth),
        getAccounts(workspaceId),
        getBudgetGroups(workspaceId),
        getIncomeCategories(workspaceId),
    ]);

    const transactions = transactionsResult.success ? transactionsResult.data ?? [] : [];
    const accounts = accountsResult.success ? accountsResult.data ?? [] : [];
    const budgetGroups = budgetGroupsResult.success ? budgetGroupsResult.data ?? [] : [];
    const incomeCategories = incomeCategoriesResult.success ? incomeCategoriesResult.data ?? [] : [];

    return (
        <TransactionsClient
            workspaceId={workspaceId}
            initialTransactions={transactions}
            accounts={accounts}
            budgetGroups={budgetGroups}
            incomeCategories={incomeCategories}
        />
    );
}
