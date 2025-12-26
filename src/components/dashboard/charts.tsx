"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/currency";
import type { MonthlyBudgetSummary } from "@/types";

interface ChartsProps {
    budgets: MonthlyBudgetSummary[];
    currency?: string;
}

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

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
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Gastos por Grupo</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-slate-400">Sem despesas neste mês</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
                <CardTitle className="text-lg text-white">Gastos por Grupo</CardTitle>
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
                                        <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                                            <p className="text-white font-medium">{data.name}</p>
                                            <p className="text-slate-300">
                                                {formatCurrency(data.value, currency as "BRL")}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            formatter={(value) => <span className="text-slate-300">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
