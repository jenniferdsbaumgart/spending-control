"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { QuickAddModal } from "@/components/transactions/quick-add-modal";
import type { TransactionWithRelations, FinancialAccountInfo, BudgetGroupWithCategories, TransactionType } from "@/types";

interface TransactionsClientProps {
    workspaceId: string;
    initialTransactions: TransactionWithRelations[];
    accounts: FinancialAccountInfo[];
    budgetGroups: BudgetGroupWithCategories[];
}

export function TransactionsClient({
    workspaceId,
    initialTransactions,
    accounts,
    budgetGroups,
}: TransactionsClientProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<TransactionType>("EXPENSE");

    function openModal(type: TransactionType) {
        setModalType(type);
        setModalOpen(true);
    }

    const typeIcons = {
        INCOME: <TrendingUp className="h-4 w-4 text-green-400" />,
        EXPENSE: <TrendingDown className="h-4 w-4 text-red-400" />,
        TRANSFER: <ArrowLeftRight className="h-4 w-4 text-blue-400" />,
    };

    const typeColors = {
        INCOME: "text-green-400",
        EXPENSE: "text-red-400",
        TRANSFER: "text-blue-400",
    };

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Transações"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            onClick={() => openModal("INCOME")}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Receita
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            onClick={() => openModal("EXPENSE")}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Despesa
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 p-6 overflow-auto">
                {initialTransactions.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                                <Receipt className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">
                                Nenhuma transação ainda
                            </h3>
                            <p className="text-slate-400 mb-6">
                                Suas transações aparecerão aqui quando você começar a registrar.
                            </p>
                            <Button
                                onClick={() => openModal("EXPENSE")}
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar transação
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-800">
                                {initialTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                                {typeIcons[transaction.type]}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {transaction.description || transaction.category?.name || "Sem descrição"}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    <span>{formatDate(transaction.date, "dd MMM yyyy")}</span>
                                                    <span>•</span>
                                                    <span>{transaction.account.name}</span>
                                                    {transaction.category && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{transaction.category.group.name} → {transaction.category.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {transaction.status === "PLANNED" && (
                                                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                                                    Planejada
                                                </Badge>
                                            )}
                                            <span className={cn("text-lg font-semibold", typeColors[transaction.type])}>
                                                {transaction.type === "INCOME" ? "+" : "-"}
                                                {formatCurrency(transaction.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

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

function Receipt(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
        </svg>
    );
}
