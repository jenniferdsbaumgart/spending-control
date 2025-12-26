import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspacesForUser } from "@/server/access";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ workspaceId: string }>;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const resolvedParams = await params;
    const workspaces = await getWorkspacesForUser(session.user.id);

    // Verify user has access to this workspace
    const hasAccess = workspaces.some((w) => w.id === resolvedParams.workspaceId);

    if (!hasAccess) {
        // Redirect to first available workspace or onboarding
        if (workspaces.length > 0) {
            redirect(`/app/${workspaces[0].id}`);
        } else {
            redirect("/onboarding");
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
