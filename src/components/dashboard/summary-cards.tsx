"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
    income: number;
    expenses: number;
    balance: number;
    currency?: string;
}

export function SummaryCards({ income, expenses, balance, currency = "BRL" }: SummaryCardsProps) {
    const cards = [
        {
            title: "Receitas",
            value: income,
            icon: TrendingUp,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/20",
        },
        {
            title: "Despesas",
            value: expenses,
            icon: TrendingDown,
            color: "text-red-400",
            bgColor: "bg-red-500/10",
            borderColor: "border-red-500/20",
        },
        {
            title: "Saldo",
            value: balance,
            icon: Wallet,
            color: balance >= 0 ? "text-purple-400" : "text-red-400",
            bgColor: balance >= 0 ? "bg-purple-500/10" : "bg-red-500/10",
            borderColor: balance >= 0 ? "border-purple-500/20" : "border-red-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card) => (
                <Card
                    key={card.title}
                    className={cn(
                        "bg-slate-900/50 border",
                        card.borderColor
                    )}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">
                            {card.title}
                        </CardTitle>
                        <div className={cn("p-2 rounded-lg", card.bgColor)}>
                            <card.icon className={cn("h-4 w-4", card.color)} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className={cn("text-2xl font-bold", card.color)}>
                            {formatCurrency(card.value, currency as "BRL")}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
