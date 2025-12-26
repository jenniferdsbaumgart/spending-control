// Type definitions for the application

import type { Role, AccountType, TransactionType, TransactionStatus } from "@prisma/client";

// Re-export Prisma enums
export type { Role, AccountType, TransactionType, TransactionStatus };

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface SessionUser {
    id: string;
    email: string;
    name: string | null;
    locale: string;
    currency: string;
}

// ============================================================================
// WORKSPACE TYPES
// ============================================================================

export interface WorkspaceSummary {
    id: string;
    name: string;
    defaultCurrency: string;
    role: Role;
}

export interface WorkspaceMemberInfo {
    id: string;
    userId: string;
    role: Role;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
}

// ============================================================================
// BUDGET TYPES
// ============================================================================

export interface BudgetGroupWithCategories {
    id: string;
    name: string;
    defaultPercent: number;
    color: string | null;
    sortOrder: number;
    isActive: boolean;
    categories: CategoryInfo[];
}

export interface CategoryInfo {
    id: string;
    name: string;
    icon: string | null;
    isActive: boolean;
    groupId: string;
}

export interface MonthlyBudgetSummary {
    groupId: string;
    groupName: string;
    groupColor: string | null;
    percentAllocation: number;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export interface TransactionWithRelations {
    id: string;
    date: Date;
    amount: number;
    type: TransactionType;
    description: string | null;
    status: TransactionStatus;
    account: {
        id: string;
        name: string;
        type: AccountType;
    };
    category: {
        id: string;
        name: string;
        group: {
            id: string;
            name: string;
            color: string | null;
        };
    } | null;
    installmentPlan: {
        id: string;
        description: string;
        installmentsCount: number;
    } | null;
    installmentNumber: number | null;
}

export interface TransactionFilters {
    type?: TransactionType;
    status?: TransactionStatus;
    categoryId?: string;
    accountId?: string;
    search?: string;
}

// ============================================================================
// MONTH SUMMARY TYPES
// ============================================================================

export interface MonthSummary {
    monthKey: string;
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
    budgetGroups: MonthlyBudgetSummary[];
}

// ============================================================================
// GOAL TYPES
// ============================================================================

export interface GoalWithProgress {
    id: string;
    name: string;
    targetAmount: number;
    initialAmount: number;
    currentAmount: number;
    color: string | null;
    icon: string | null;
    isCompleted: boolean;
    progressPercent: number;
    remainingAmount: number;
    contributions: GoalContributionInfo[];
}

export interface GoalContributionInfo {
    id: string;
    amount: number;
    date: Date;
    note: string | null;
}

// ============================================================================
// INSTALLMENT TYPES
// ============================================================================

export interface InstallmentPlanWithDetails {
    id: string;
    description: string;
    merchant: string | null;
    totalAmount: number;
    installmentsCount: number;
    firstDueDate: Date;
    isActive: boolean;
    accountId: string;
    categoryId: string;
    paidCount: number;
    remainingCount: number;
    nextDueDate: Date | null;
    transactions: InstallmentTransactionInfo[];
}

export interface InstallmentTransactionInfo {
    id: string;
    date: Date;
    amount: number;
    status: TransactionStatus;
    installmentNumber: number;
}

// ============================================================================
// ACCOUNT TYPES
// ============================================================================

export interface FinancialAccountInfo {
    id: string;
    name: string;
    type: AccountType;
    isDefault: boolean;
    isActive: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ActionResponse<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
