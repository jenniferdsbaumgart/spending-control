"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canEdit, canAdmin } from "@/server/access";
import { ensureMonthlyPlanExists, updateMonthlyAllocation, validatePercentages } from "@/domain/budget";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse, BudgetGroupWithCategories, CategoryInfo } from "@/types";

const createGroupSchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    defaultPercent: z.number().min(0).max(100),
    color: z.string().optional(),
});

const updateGroupSchema = createGroupSchema.partial();

const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    groupId: z.string().min(1, "Group is required"),
    icon: z.string().optional(),
});

/**
 * Get all budget groups with categories
 */
export async function getBudgetGroups(
    workspaceId: string
): Promise<ActionResponse<BudgetGroupWithCategories[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const groups = await prisma.budgetGroup.findMany({
            where: { workspaceId, isActive: true },
            include: {
                categories: {
                    where: { isActive: true },
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { sortOrder: "asc" },
        });

        const mapped: BudgetGroupWithCategories[] = groups.map((g) => ({
            id: g.id,
            name: g.name,
            defaultPercent: g.defaultPercent.toNumber(),
            color: g.color,
            sortOrder: g.sortOrder,
            isActive: g.isActive,
            categories: g.categories.map((c) => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                isActive: c.isActive,
                groupId: c.groupId,
            })),
        }));

        return { success: true, data: mapped };
    } catch (error) {
        console.error("Error getting budget groups:", error);
        return { success: false, error: "Failed to get budget groups" };
    }
}

/**
 * Create a new budget group
 */
export async function createBudgetGroup(
    workspaceId: string,
    data: z.infer<typeof createGroupSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const validated = createGroupSchema.parse(data);

        // Get current max sort order
        const maxOrder = await prisma.budgetGroup.aggregate({
            where: { workspaceId },
            _max: { sortOrder: true },
        });

        const group = await prisma.budgetGroup.create({
            data: {
                workspaceId,
                name: validated.name,
                defaultPercent: validated.defaultPercent,
                color: validated.color,
                sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
            },
        });

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true, data: { id: group.id } };
    } catch (error) {
        console.error("Error creating budget group:", error);
        return { success: false, error: "Failed to create budget group" };
    }
}

/**
 * Update a budget group
 */
export async function updateBudgetGroup(
    workspaceId: string,
    groupId: string,
    data: z.infer<typeof updateGroupSchema>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const validated = updateGroupSchema.parse(data);

        // Verify group belongs to workspace
        const existing = await prisma.budgetGroup.findFirst({
            where: { id: groupId, workspaceId },
        });

        if (!existing) {
            return { success: false, error: "Budget group not found" };
        }

        await prisma.budgetGroup.update({
            where: { id: groupId },
            data: validated,
        });

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true };
    } catch (error) {
        console.error("Error updating budget group:", error);
        return { success: false, error: "Failed to update budget group" };
    }
}

/**
 * Update default percentages for all groups
 */
export async function updateGroupPercentages(
    workspaceId: string,
    percentages: { groupId: string; percent: number }[]
): Promise<ActionResponse<{ valid: boolean; total: number }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        // Validate percentages
        const validation = validatePercentages(percentages.map((p) => p.percent));

        // Update all percentages in a transaction
        await prisma.$transaction(
            percentages.map((p) =>
                prisma.budgetGroup.updateMany({
                    where: { id: p.groupId, workspaceId },
                    data: { defaultPercent: p.percent },
                })
            )
        );

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true, data: validation };
    } catch (error) {
        console.error("Error updating percentages:", error);
        return { success: false, error: "Failed to update percentages" };
    }
}

/**
 * Update monthly allocation for a specific group (this month only)
 */
export async function updateMonthlyGroupAllocation(
    workspaceId: string,
    yearMonth: string,
    groupId: string,
    percent: number
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await updateMonthlyAllocation(workspaceId, yearMonth, groupId, percent);

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating monthly allocation:", error);
        return { success: false, error: "Failed to update allocation" };
    }
}

/**
 * Delete a budget group (soft delete)
 */
export async function deleteBudgetGroup(
    workspaceId: string,
    groupId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await prisma.budgetGroup.updateMany({
            where: { id: groupId, workspaceId },
            data: { isActive: false },
        });

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting budget group:", error);
        return { success: false, error: "Failed to delete budget group" };
    }
}

/**
 * Create a new category
 */
export async function createCategory(
    workspaceId: string,
    data: z.infer<typeof createCategorySchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const validated = createCategorySchema.parse(data);

        // Verify group belongs to workspace
        const group = await prisma.budgetGroup.findFirst({
            where: { id: validated.groupId, workspaceId },
        });

        if (!group) {
            return { success: false, error: "Budget group not found" };
        }

        const category = await prisma.budgetCategory.create({
            data: {
                workspaceId,
                groupId: validated.groupId,
                name: validated.name,
                icon: validated.icon,
            },
        });

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true, data: { id: category.id } };
    } catch (error) {
        console.error("Error creating category:", error);
        return { success: false, error: "Failed to create category" };
    }
}

/**
 * Update a category
 */
export async function updateCategory(
    workspaceId: string,
    categoryId: string,
    data: { name?: string; icon?: string }
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await prisma.budgetCategory.updateMany({
            where: { id: categoryId, workspaceId },
            data,
        });

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true };
    } catch (error) {
        console.error("Error updating category:", error);
        return { success: false, error: "Failed to update category" };
    }
}

/**
 * Delete a category (soft delete)
 */
export async function deleteCategory(
    workspaceId: string,
    categoryId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await prisma.budgetCategory.updateMany({
            where: { id: categoryId, workspaceId },
            data: { isActive: false },
        });

        revalidatePath(`/app/${workspaceId}/budgets`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting category:", error);
        return { success: false, error: "Failed to delete category" };
    }
}
