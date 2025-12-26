"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card className="glass-card border-border">
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Nenhum grupo de orçamento configurado.</p>
                    <p className="text-muted-foreground text-sm mt-1">
                        Configure grupos em Orçamentos para ver a divisão do seu dinheiro.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-border">
            <CardHeader>
                <CardTitle className="text-lg text-foreground">Orçamento vs Realizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgets.map((budget) => {
                    const progressPercent = budget.budgetAmount > 0
                        ? Math.min((budget.spentAmount / budget.budgetAmount) * 100, 100)
                        : 0;
                    const isOverBudget = budget.spentAmount > budget.budgetAmount;
                    const groupColor = budget.groupColor || "#8b5cf6"; // Default to violet

                    return (
                        <div key={budget.groupId} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: groupColor }}
                                    />
                                    <span className="text-foreground font-medium">{budget.groupName}</span>
                                    <span className="text-muted-foreground text-sm">
                                        ({formatPercent(budget.percentAllocation)})
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "font-medium",
                                        isOverBudget ? "text-destructive" : "text-foreground"
                                    )}>
                                        {formatCurrency(budget.spentAmount, currency as "BRL")}
                                    </span>
                                    <span className="text-muted-foreground"> / </span>
                                    <span className="text-muted-foreground">
                                        {formatCurrency(budget.budgetAmount, currency as "BRL")}
                                    </span>
                                </div>
                            </div>
                            {/* Progress bar with dynamic colour */}
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: isOverBudget ? "hsl(var(--destructive))" : groupColor,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className={cn(
                                    isOverBudget ? "text-destructive" : "text-muted-foreground"
                                )}>
                                    {isOverBudget ? "Excedido" : "Restante"}: {formatCurrency(Math.abs(budget.remainingAmount), currency as "BRL")}
                                </span>
                                <span className="text-muted-foreground">
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
