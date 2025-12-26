"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/currency";
import type { MonthlyBudgetSummary } from "@/types";

interface ChartsProps {
    budgets: MonthlyBudgetSummary[];
    currency?: string;
}

// Turquoise/Cool Palette
const COLORS = ["#2dd4bf", "#38bdf8", "#818cf8", "#c084fc", "#22d3ee", "#f472b6"];

export function SpendingByGroupChart({ budgets, currency = "BRL" }: ChartsProps) {
    const data = budgets
        .filter((b) => b.spentAmount > 0)
        .map((b, index) => ({
            name: b.groupName,
            value: b.spentAmount,
            color: b.groupColor || COLORS[index % COLORS.length],
        }));

    if (data.length === 0) {
        return (
            <Card className="glass-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground">Gastos por Grupo</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Sem despesas neste mês</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card border-border">
            <CardHeader>
                <CardTitle className="text-lg text-foreground">Gastos por Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                                            <p className="text-popover-foreground font-medium">{data.name}</p>
                                            <p className="text-muted-foreground">
                                                {formatCurrency(data.value, currency as "BRL")}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
