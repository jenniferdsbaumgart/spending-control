import { getGoals } from "@/server/actions/goals";
import { GoalsClient } from "./client";

export default async function GoalsPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const resolvedParams = await params;
    const { workspaceId } = resolvedParams;

    const result = await getGoals(workspaceId);
    const goals = result.success ? result.data ?? [] : [];

    return <GoalsClient workspaceId={workspaceId} goals={goals} />;
}
