"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canEdit } from "@/server/access";
import { getAllGoalsWithProgress, getGoalWithProgress, addGoalContribution } from "@/domain/goals";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse, GoalWithProgress } from "@/types";

const createGoalSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    targetAmount: z.number().positive("Target amount must be positive"),
    initialAmount: z.number().min(0).default(0),
    color: z.string().optional(),
    icon: z.string().optional(),
});

const addContributionSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    date: z.coerce.date(),
    note: z.string().optional(),
});

/**
 * Get all goals with progress
 */
export async function getGoals(
    workspaceId: string
): Promise<ActionResponse<GoalWithProgress[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const goals = await getAllGoalsWithProgress(workspaceId);
        return { success: true, data: goals };
    } catch (error) {
        console.error("Error getting goals:", error);
        return { success: false, error: "Failed to get goals" };
    }
}

/**
 * Get a single goal with progress
 */
export async function getGoal(
    workspaceId: string,
    goalId: string
): Promise<ActionResponse<GoalWithProgress>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const goal = await getGoalWithProgress(goalId, workspaceId);
        if (!goal) {
            return { success: false, error: "Goal not found" };
        }

        return { success: true, data: goal };
    } catch (error) {
        console.error("Error getting goal:", error);
        return { success: false, error: "Failed to get goal" };
    }
}

/**
 * Create a new goal
 */
export async function createGoal(
    workspaceId: string,
    data: z.infer<typeof createGoalSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = createGoalSchema.parse(data);

        const goal = await prisma.goal.create({
            data: {
                workspaceId,
                name: validated.name,
                targetAmount: validated.targetAmount,
                initialAmount: validated.initialAmount,
                color: validated.color,
                icon: validated.icon,
            },
        });

        revalidatePath(`/app/${workspaceId}/goals`);
        return { success: true, data: { id: goal.id } };
    } catch (error) {
        console.error("Error creating goal:", error);
        return { success: false, error: "Failed to create goal" };
    }
}

/**
 * Update a goal
 */
export async function updateGoal(
    workspaceId: string,
    goalId: string,
    data: Partial<z.infer<typeof createGoalSchema>>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        // Verify goal belongs to workspace
        const existing = await prisma.goal.findFirst({
            where: { id: goalId, workspaceId },
        });

        if (!existing) {
            return { success: false, error: "Goal not found" };
        }

        await prisma.goal.update({
            where: { id: goalId },
            data,
        });

        revalidatePath(`/app/${workspaceId}/goals`);
        return { success: true };
    } catch (error) {
        console.error("Error updating goal:", error);
        return { success: false, error: "Failed to update goal" };
    }
}

/**
 * Delete a goal
 */
export async function deleteGoal(
    workspaceId: string,
    goalId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        // Cascade delete contributions
        await prisma.$transaction([
            prisma.goalContribution.deleteMany({ where: { goalId } }),
            prisma.goal.deleteMany({ where: { id: goalId, workspaceId } }),
        ]);

        revalidatePath(`/app/${workspaceId}/goals`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting goal:", error);
        return { success: false, error: "Failed to delete goal" };
    }
}

/**
 * Add a contribution to a goal
 */
export async function addContribution(
    workspaceId: string,
    goalId: string,
    data: z.infer<typeof addContributionSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = addContributionSchema.parse(data);

        const contribution = await addGoalContribution(
            goalId,
            workspaceId,
            validated.amount,
            validated.date,
            validated.note
        );

        revalidatePath(`/app/${workspaceId}/goals`);
        return { success: true, data: { id: contribution.id } };
    } catch (error) {
        console.error("Error adding contribution:", error);
        return { success: false, error: "Failed to add contribution" };
    }
}

/**
 * Delete a contribution
 */
export async function deleteContribution(
    workspaceId: string,
    contributionId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        // Verify contribution belongs to a goal in this workspace
        const contribution = await prisma.goalContribution.findUnique({
            where: { id: contributionId },
            include: { goal: true },
        });

        if (!contribution || contribution.goal.workspaceId !== workspaceId) {
            return { success: false, error: "Contribution not found" };
        }

        await prisma.goalContribution.delete({
            where: { id: contributionId },
        });

        revalidatePath(`/app/${workspaceId}/goals`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting contribution:", error);
        return { success: false, error: "Failed to delete contribution" };
    }
}
