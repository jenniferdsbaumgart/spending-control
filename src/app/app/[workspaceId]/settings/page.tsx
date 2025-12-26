import { getWorkspace, getWorkspaceMembers } from "@/server/actions/workspace";
import { SettingsClient } from "./client";

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const resolvedParams = await params;
    const { workspaceId } = resolvedParams;

    const [workspaceResult, membersResult] = await Promise.all([
        getWorkspace(workspaceId),
        getWorkspaceMembers(workspaceId),
    ]);

    const workspace = workspaceResult.success ? workspaceResult.data : null;
    const members = membersResult.success ? membersResult.data ?? [] : [];

    if (!workspace) {
        return <div className="p-6 text-white">Workspace not found</div>;
    }

    return (
        <SettingsClient
            workspaceId={workspaceId}
            workspace={workspace}
            members={members}
        />
    );
}
