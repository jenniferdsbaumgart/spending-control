"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canAdmin } from "@/server/access";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

export interface IncomeCategoryInfo {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    isActive: boolean;
}

const createIncomeCategorySchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    icon: z.string().optional(),
    color: z.string().optional(),
});

/**
 * Get all income categories for a workspace
 */
export async function getIncomeCategories(
    workspaceId: string
): Promise<ActionResponse<IncomeCategoryInfo[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const categories = await prisma.incomeCategory.findMany({
            where: { workspaceId, isActive: true },
            orderBy: { name: "asc" },
        });

        const mapped: IncomeCategoryInfo[] = categories.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            isActive: c.isActive,
        }));

        return { success: true, data: mapped };
    } catch (error) {
        console.error("Error getting income categories:", error);
        return { success: false, error: "Failed to get income categories" };
    }
}

/**
 * Create a new income category
 */
export async function createIncomeCategory(
    workspaceId: string,
    data: z.infer<typeof createIncomeCategorySchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        const validated = createIncomeCategorySchema.parse(data);

        const category = await prisma.incomeCategory.create({
            data: {
                workspaceId,
                name: validated.name,
                icon: validated.icon,
                color: validated.color,
            },
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true, data: { id: category.id } };
    } catch (error) {
        console.error("Error creating income category:", error);
        return { success: false, error: "Failed to create income category" };
    }
}

/**
 * Update an income category
 */
export async function updateIncomeCategory(
    workspaceId: string,
    categoryId: string,
    data: { name?: string; icon?: string; color?: string }
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await prisma.incomeCategory.updateMany({
            where: { id: categoryId, workspaceId },
            data,
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating income category:", error);
        return { success: false, error: "Failed to update income category" };
    }
}

/**
 * Delete an income category (soft delete)
 */
export async function deleteIncomeCategory(
    workspaceId: string,
    categoryId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        await prisma.incomeCategory.updateMany({
            where: { id: categoryId, workspaceId },
            data: { isActive: false },
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting income category:", error);
        return { success: false, error: "Failed to delete income category" };
    }
}

/**
 * Seed default income categories for a workspace
 */
export async function seedDefaultIncomeCategories(
    workspaceId: string
): Promise<ActionResponse> {
    try {
        const defaultCategories = [
            { name: "Salário", icon: "💼", color: "#22c55e" },
            { name: "Freelance", icon: "💻", color: "#3b82f6" },
            { name: "Investimentos", icon: "📈", color: "#8b5cf6" },
            { name: "Presente", icon: "🎁", color: "#ec4899" },
            { name: "Reembolso", icon: "↩️", color: "#f97316" },
            { name: "Outros", icon: "📦", color: "#6b7280" },
        ];

        await prisma.incomeCategory.createMany({
            data: defaultCategories.map((cat) => ({
                workspaceId,
                ...cat,
            })),
            skipDuplicates: true,
        });

        return { success: true };
    } catch (error) {
        console.error("Error seeding income categories:", error);
        return { success: false, error: "Failed to seed income categories" };
    }
}
