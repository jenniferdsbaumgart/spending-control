import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspacesForUser } from "@/server/access";

export default async function AppIndexPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const workspaces = await getWorkspacesForUser(session.user.id);

    if (workspaces.length === 0) {
        redirect("/onboarding");
    }

    // Redirect to first workspace
    redirect(`/app/${workspaces[0].id}`);
}
