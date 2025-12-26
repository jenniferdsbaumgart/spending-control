import { getInstallmentPlans } from "@/server/actions/installments";
import { getAccounts } from "@/server/actions/accounts";
import { getBudgetGroups } from "@/server/actions/budgets";
import { InstallmentsClient } from "./client";

export default async function InstallmentsPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const resolvedParams = await params;
    const { workspaceId } = resolvedParams;

    const [plansResult, accountsResult, budgetGroupsResult] = await Promise.all([
        getInstallmentPlans(workspaceId),
        getAccounts(workspaceId),
        getBudgetGroups(workspaceId),
    ]);

    const plans = plansResult.success ? plansResult.data ?? [] : [];
    const accounts = accountsResult.success ? accountsResult.data ?? [] : [];
    const budgetGroups = budgetGroupsResult.success ? budgetGroupsResult.data ?? [] : [];

    return (
        <InstallmentsClient
            workspaceId={workspaceId}
            plans={plans}
            accounts={accounts}
            budgetGroups={budgetGroups}
        />
    );
}
