"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canAdmin, getWorkspacesForUser } from "@/server/access";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse, WorkspaceSummary, WorkspaceMemberInfo } from "@/types";

const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    defaultCurrency: z.string().default("BRL"),
});

const inviteMemberSchema = z.object({
    email: z.string().email("Invalid email"),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

const updateMemberRoleSchema = z.object({
    memberId: z.string(),
    role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

/**
 * Get all workspaces for the current user
 */
export async function getUserWorkspaces(): Promise<ActionResponse<WorkspaceSummary[]>> {
    try {
        const user = await getCurrentUser();
        const workspaces = await getWorkspacesForUser(user.id);
        return { success: true, data: workspaces };
    } catch (error) {
        console.error("Error getting workspaces:", error);
        return { success: false, error: "Failed to get workspaces" };
    }
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
    data: z.infer<typeof createWorkspaceSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const validated = createWorkspaceSchema.parse(data);

        const workspace = await prisma.workspace.create({
            data: {
                name: validated.name,
                defaultCurrency: validated.defaultCurrency,
                members: {
                    create: {
                        userId: user.id,
                        role: "ADMIN",
                    },
                },
            },
        });

        revalidatePath("/app");
        return { success: true, data: { id: workspace.id } };
    } catch (error) {
        console.error("Error creating workspace:", error);
        return { success: false, error: "Failed to create workspace" };
    }
}

/**
 * Get workspace details
 */
export async function getWorkspace(workspaceId: string) {
    try {
        const user = await getCurrentUser();
        const { workspace, role } = await requireWorkspaceRole(user.id, workspaceId);

        return {
            success: true,
            data: {
                id: workspace.id,
                name: workspace.name,
                defaultCurrency: workspace.defaultCurrency,
                role,
            },
        };
    } catch (error) {
        console.error("Error getting workspace:", error);
        return { success: false, error: "Failed to get workspace" };
    }
}

/**
 * Update workspace settings
 */
export async function updateWorkspace(
    workspaceId: string,
    data: { name?: string; defaultCurrency?: string }
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data,
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating workspace:", error);
        return { success: false, error: "Failed to update workspace" };
    }
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(
    workspaceId: string
): Promise<ActionResponse<WorkspaceMemberInfo[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return {
            success: true,
            data: members.map((m) => ({
                id: m.id,
                userId: m.userId,
                role: m.role,
                user: m.user,
            })),
        };
    } catch (error) {
        console.error("Error getting members:", error);
        return { success: false, error: "Failed to get members" };
    }
}

/**
 * Invite a member to the workspace
 */
export async function inviteMember(
    workspaceId: string,
    data: z.infer<typeof inviteMemberSchema>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const validated = inviteMemberSchema.parse(data);

        // Find user by email
        const invitedUser = await prisma.user.findUnique({
            where: { email: validated.email },
        });

        if (!invitedUser) {
            return { success: false, error: "User not found. They need to register first." };
        }

        // Check if already a member
        const existingMember = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: invitedUser.id,
                    workspaceId,
                },
            },
        });

        if (existingMember) {
            return { success: false, error: "User is already a member" };
        }

        // Add member
        await prisma.workspaceMember.create({
            data: {
                userId: invitedUser.id,
                workspaceId,
                role: validated.role,
            },
        });

        revalidatePath(`/app/${workspaceId}/settings`);
        return { success: true };
    } catch (error) {
        console.error("Error inviting member:", error);
        return { success: false, error: "Failed to invite member" };
    }
}

/**
 * Update member role
 */
export async function updateMemberRole(
    workspaceId: string,
    data: z.infer<typeof updateMemberRoleSchema>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const validated = updateMemberRoleSchema.parse(data);

        // Can't change own role
        const member = await prisma.workspaceMember.findUnique({
            where: { id: validated.memberId },
        });

        if (member?.userId === user.id) {
            return { success: false, error: "Cannot change your own role" };
        }

        await prisma.workspaceMember.update({
            where: { id: validated.memberId },
            data: { role: validated.role },
        });

        revalidatePath(`/app/${workspaceId}/settings`);
        return { success: true };
    } catch (error) {
        console.error("Error updating member role:", error);
        return { success: false, error: "Failed to update role" };
    }
}

/**
 * Remove a member from workspace
 */
export async function removeMember(
    workspaceId: string,
    memberId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const member = await prisma.workspaceMember.findUnique({
            where: { id: memberId },
        });

        if (member?.userId === user.id) {
            return { success: false, error: "Cannot remove yourself" };
        }

        await prisma.workspaceMember.delete({
            where: { id: memberId },
        });

        revalidatePath(`/app/${workspaceId}/settings`);
        return { success: true };
    } catch (error) {
        console.error("Error removing member:", error);
        return { success: false, error: "Failed to remove member" };
    }
}
