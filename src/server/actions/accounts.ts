"use server";

import { prisma } from "@/db/prisma";
import { getCurrentUser, requireWorkspaceRole, canEdit, canAdmin } from "@/server/access";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResponse, FinancialAccountInfo } from "@/types";

const createAccountSchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    type: z.enum(["CASH", "BANK", "CREDIT", "INVESTMENT", "DEBT"]),
    isDefault: z.boolean().default(false),
});

const updateAccountSchema = createAccountSchema.partial();

/**
 * Get all financial accounts
 */
export async function getAccounts(
    workspaceId: string
): Promise<ActionResponse<FinancialAccountInfo[]>> {
    try {
        const user = await getCurrentUser();
        await requireWorkspaceRole(user.id, workspaceId);

        const accounts = await prisma.financialAccount.findMany({
            where: { workspaceId, isActive: true },
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        });

        const mapped: FinancialAccountInfo[] = accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            isDefault: a.isDefault,
            isActive: a.isActive,
        }));

        return { success: true, data: mapped };
    } catch (error) {
        console.error("Error getting accounts:", error);
        return { success: false, error: "Failed to get accounts" };
    }
}

/**
 * Create a new financial account
 */
export async function createAccount(
    workspaceId: string,
    data: z.infer<typeof createAccountSchema>
): Promise<ActionResponse<{ id: string }>> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = createAccountSchema.parse(data);

        // If this is default, unset other defaults
        if (validated.isDefault) {
            await prisma.financialAccount.updateMany({
                where: { workspaceId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const account = await prisma.financialAccount.create({
            data: {
                workspaceId,
                name: validated.name,
                type: validated.type,
                isDefault: validated.isDefault,
            },
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true, data: { id: account.id } };
    } catch (error) {
        console.error("Error creating account:", error);
        return { success: false, error: "Failed to create account" };
    }
}

/**
 * Update a financial account
 */
export async function updateAccount(
    workspaceId: string,
    accountId: string,
    data: z.infer<typeof updateAccountSchema>
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "EDITOR");

        if (!canEdit(role)) {
            return { success: false, error: "Edit permission required" };
        }

        const validated = updateAccountSchema.parse(data);

        // Verify account belongs to workspace
        const existing = await prisma.financialAccount.findFirst({
            where: { id: accountId, workspaceId },
        });

        if (!existing) {
            return { success: false, error: "Account not found" };
        }

        // If setting as default, unset other defaults
        if (validated.isDefault) {
            await prisma.financialAccount.updateMany({
                where: { workspaceId, isDefault: true, id: { not: accountId } },
                data: { isDefault: false },
            });
        }

        await prisma.financialAccount.update({
            where: { id: accountId },
            data: validated,
        });

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating account:", error);
        return { success: false, error: "Failed to update account" };
    }
}

/**
 * Delete a financial account (soft delete)
 */
export async function deleteAccount(
    workspaceId: string,
    accountId: string
): Promise<ActionResponse> {
    try {
        const user = await getCurrentUser();
        const { role } = await requireWorkspaceRole(user.id, workspaceId, "ADMIN");

        if (!canAdmin(role)) {
            return { success: false, error: "Admin role required" };
        }

        // Check if account has transactions
        const transactionCount = await prisma.transaction.count({
            where: { accountId, status: { not: "VOID" } },
        });

        if (transactionCount > 0) {
            // Soft delete if has transactions
            await prisma.financialAccount.updateMany({
                where: { id: accountId, workspaceId },
                data: { isActive: false },
            });
        } else {
            // Hard delete if no transactions
            await prisma.financialAccount.deleteMany({
                where: { id: accountId, workspaceId },
            });
        }

        revalidatePath(`/app/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting account:", error);
        return { success: false, error: "Failed to delete account" };
    }
}
