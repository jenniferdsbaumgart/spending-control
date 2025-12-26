import { redirect } from "next/navigation";
import { getCurrentMonthKey } from "@/lib/date";

export default async function WorkspacePage({
    params,
}: {
    params: Promise<{ workspaceId: string }>;
}) {
    const resolvedParams = await params;
    const currentMonth = getCurrentMonthKey();
    redirect(`/app/${resolvedParams.workspaceId}/month/${currentMonth}`);
}
