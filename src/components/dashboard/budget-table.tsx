"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { MonthlyBudgetSummary } from "@/types";

interface BudgetTableProps {
    budgets: MonthlyBudgetSummary[];
    currency?: string;
}

export function BudgetTable({ budgets, currency = "BRL" }: BudgetTableProps) {
    if (budgets.length === 0) {
        return (
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-12 text-center">
                    <p className="text-slate-400">Nenhum grupo de orçamento configurado.</p>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure grupos em Orçamentos para ver a divisão do seu dinheiro.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg text-white">Orçamento vs Realizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgets.map((budget) => {
                    const progressPercent = budget.budgetAmount > 0
                        ? Math.min((budget.spentAmount / budget.budgetAmount) * 100, 100)
                        : 0;
                    const isOverBudget = budget.spentAmount > budget.budgetAmount;

                    return (
                        <div key={budget.groupId} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {budget.groupColor && (
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: budget.groupColor }}
                                        />
                                    )}
                                    <span className="text-white font-medium">{budget.groupName}</span>
                                    <span className="text-slate-500 text-sm">
                                        ({formatPercent(budget.percentAllocation)})
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "font-medium",
                                        isOverBudget ? "text-red-400" : "text-slate-300"
                                    )}>
                                        {formatCurrency(budget.spentAmount, currency as "BRL")}
                                    </span>
                                    <span className="text-slate-500"> / </span>
                                    <span className="text-slate-400">
                                        {formatCurrency(budget.budgetAmount, currency as "BRL")}
                                    </span>
                                </div>
                            </div>
                            <Progress
                                value={progressPercent}
                                className={cn(
                                    "h-2",
                                    isOverBudget ? "[&>div]:bg-red-500" : "[&>div]:bg-purple-500"
                                )}
                            />
                            <div className="flex justify-between text-sm">
                                <span className={cn(
                                    isOverBudget ? "text-red-400" : "text-slate-500"
                                )}>
                                    {isOverBudget ? "Excedido" : "Restante"}: {formatCurrency(Math.abs(budget.remainingAmount), currency as "BRL")}
                                </span>
                                <span className="text-slate-500">
                                    {Math.round(progressPercent)}% usado
                                </span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
