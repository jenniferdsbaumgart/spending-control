import { prisma } from "@/db/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends Error {
    constructor(message = "Forbidden") {
        super(message);
        this.name = "ForbiddenError";
    }
}

/**
 * Role hierarchy for permission checks
 */
const roleHierarchy: Record<Role, number> = {
    VIEWER: 1,
    EDITOR: 2,
    ADMIN: 3,
};

/**
 * Check if a role meets the minimum required role
 */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
    return roleHierarchy[userRole] >= roleHierarchy[minRole];
}

/**
 * Check if user can edit (EDITOR or ADMIN)
 */
export function canEdit(role: Role): boolean {
    return hasMinRole(role, "EDITOR");
}

/**
 * Check if user is admin
 */
export function canAdmin(role: Role): boolean {
    return role === "ADMIN";
}

/**
 * Get the current authenticated user from session
 */
export async function getCurrentUser() {
    const session = await auth();

    if (!session?.user?.id) {
        throw new UnauthorizedError("Not authenticated");
    }

    return {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
    };
}

/**
 * Require a user to be a member of a workspace with at least the specified role
 */
export async function requireWorkspaceRole(
    userId: string,
    workspaceId: string,
    minRole: Role = "VIEWER"
) {
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            userId_workspaceId: {
                userId,
                workspaceId,
            },
        },
        include: {
            workspace: true,
        },
    });

    if (!membership) {
        throw new ForbiddenError("You are not a member of this workspace");
    }

    if (!hasMinRole(membership.role, minRole)) {
        throw new ForbiddenError(
            `This action requires ${minRole} role or higher`
        );
    }

    return {
        membership,
        workspace: membership.workspace,
        role: membership.role,
    };
}

/**
 * Get all workspaces for a user
 */
export async function getWorkspacesForUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        include: {
            workspace: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        defaultCurrency: m.workspace.defaultCurrency,
        role: m.role,
    }));
}

/**
 * Check if user has access to a workspace (any role)
 */
export async function hasWorkspaceAccess(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const membership = await prisma.workspaceMember.findUnique({
        where: {
            userId_workspaceId: {
                userId,
                workspaceId,
            },
        },
    });

    return !!membership;
}

/**
 * Get workspace with access check
 */
export async function getWorkspaceWithAccess(
    userId: string,
    workspaceId: string
) {
    const { workspace, role } = await requireWorkspaceRole(userId, workspaceId);
    return { workspace, role };
}

/**
 * Helper to scope Prisma queries to a workspace
 * This ensures all queries include the workspaceId filter
 */
export function scopeToWorkspace(workspaceId: string) {
    return {
        workspaceId,
    };
}

/**
 * Validate that an entity belongs to a workspace
 */
export async function validateEntityOwnership<T extends { workspaceId: string }>(
    entity: T | null,
    workspaceId: string
): Promise<T> {
    if (!entity) {
        throw new Error("Entity not found");
    }

    if (entity.workspaceId !== workspaceId) {
        throw new ForbiddenError("Access denied");
    }

    return entity;
}
