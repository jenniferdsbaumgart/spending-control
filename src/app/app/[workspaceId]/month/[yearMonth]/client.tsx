"use client";

import { useState } from "react";
import { Header, QuickActions } from "@/components/layout/header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetTable } from "@/components/dashboard/budget-table";
import { SpendingByGroupChart } from "@/components/dashboard/charts";
import { QuickAddModal } from "@/components/transactions/quick-add-modal";
import type { MonthSummary, FinancialAccountInfo, BudgetGroupWithCategories, TransactionType } from "@/types";

interface MonthDashboardClientProps {
    workspaceId: string;
    yearMonth: string;
    summary: MonthSummary;
    accounts: FinancialAccountInfo[];
    budgetGroups: BudgetGroupWithCategories[];
}

export function MonthDashboardClient({
    workspaceId,
    yearMonth,
    summary,
    accounts,
    budgetGroups,
}: MonthDashboardClientProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<TransactionType>("EXPENSE");

    function openModal(type: TransactionType) {
        setModalType(type);
        setModalOpen(true);
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                showMonthNav
                yearMonth={yearMonth}
                actions={
                    <QuickActions
                        onAddIncome={() => openModal("INCOME")}
                        onAddExpense={() => openModal("EXPENSE")}
                    />
                }
            />

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* Summary Cards */}
                <SummaryCards
                    income={summary.incomeTotal}
                    expenses={summary.expenseTotal}
                    balance={summary.balance}
                />

                {/* Budget vs Actual + Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BudgetTable budgets={summary.budgetGroups} />
                    <SpendingByGroupChart budgets={summary.budgetGroups} />
                </div>
            </div>

            {/* Quick Add Modal */}
            <QuickAddModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                workspaceId={workspaceId}
                type={modalType}
                accounts={accounts}
                budgetGroups={budgetGroups}
            />
        </div>
    );
}
