/**
 * Goals Domain Service
 *
 * Handles goal progress calculations and contributions.
 */

import { prisma } from "@/db/prisma";
import type { GoalWithProgress } from "@/types";

/**
 * Get a goal with calculated progress
 */
export async function getGoalWithProgress(
    goalId: string,
    workspaceId: string
): Promise<GoalWithProgress | null> {
    const goal = await prisma.goal.findFirst({
        where: {
            id: goalId,
            workspaceId,
        },
        include: {
            contributions: {
                orderBy: { date: "desc" },
            },
        },
    });

    if (!goal) return null;

    // Calculate current amount from contributions
    const contributionsTotal = goal.contributions.reduce(
        (sum, c) => sum + c.amount.toNumber(),
        0
    );
    const currentAmount = goal.initialAmount.toNumber() + contributionsTotal;
    const targetAmount = goal.targetAmount.toNumber();
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const progressPercent = Math.min(100, (currentAmount / targetAmount) * 100);

    return {
        id: goal.id,
        name: goal.name,
        targetAmount,
        initialAmount: goal.initialAmount.toNumber(),
        currentAmount,
        color: goal.color,
        icon: goal.icon,
        isCompleted: goal.isCompleted,
        progressPercent,
        remainingAmount,
        contributions: goal.contributions.map((c) => ({
            id: c.id,
            amount: c.amount.toNumber(),
            date: c.date,
            note: c.note,
        })),
    };
}

/**
 * Get all goals with progress for a workspace
 */
export async function getAllGoalsWithProgress(
    workspaceId: string
): Promise<GoalWithProgress[]> {
    const goals = await prisma.goal.findMany({
        where: { workspaceId },
        include: {
            contributions: {
                orderBy: { date: "desc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return goals.map((goal) => {
        const contributionsTotal = goal.contributions.reduce(
            (sum, c) => sum + c.amount.toNumber(),
            0
        );
        const currentAmount = goal.initialAmount.toNumber() + contributionsTotal;
        const targetAmount = goal.targetAmount.toNumber();
        const remainingAmount = Math.max(0, targetAmount - currentAmount);
        const progressPercent = Math.min(100, (currentAmount / targetAmount) * 100);

        return {
            id: goal.id,
            name: goal.name,
            targetAmount,
            initialAmount: goal.initialAmount.toNumber(),
            currentAmount,
            color: goal.color,
            icon: goal.icon,
            isCompleted: goal.isCompleted,
            progressPercent,
            remainingAmount,
            contributions: goal.contributions.map((c) => ({
                id: c.id,
                amount: c.amount.toNumber(),
                date: c.date,
                note: c.note,
            })),
        };
    });
}

/**
 * Add a contribution to a goal
 */
export async function addGoalContribution(
    goalId: string,
    workspaceId: string,
    amount: number,
    date: Date,
    note?: string
) {
    // Verify goal belongs to workspace
    const goal = await prisma.goal.findFirst({
        where: { id: goalId, workspaceId },
    });

    if (!goal) {
        throw new Error("Goal not found");
    }

    const contribution = await prisma.goalContribution.create({
        data: {
            goalId,
            amount,
            date,
            note,
        },
    });

    // Check if goal is now completed
    const updatedGoal = await getGoalWithProgress(goalId, workspaceId);
    if (updatedGoal && updatedGoal.progressPercent >= 100 && !goal.isCompleted) {
        await prisma.goal.update({
            where: { id: goalId },
            data: { isCompleted: true },
        });
    }

    return contribution;
}
