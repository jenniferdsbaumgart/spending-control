import { Header } from "@/components/layout/header";
import { getBudgetGroups } from "@/server/actions/budgets";
import { BudgetsClient } from "./client";

export default async function BudgetsPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const resolvedParams = await params;
    const { workspaceId } = resolvedParams;

    const result = await getBudgetGroups(workspaceId);
    const budgetGroups = result.success ? result.data ?? [] : [];

    return <BudgetsClient workspaceId={workspaceId} budgetGroups={budgetGroups} />;
}
