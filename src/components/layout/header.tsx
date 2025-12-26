"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth, getCurrentMonthKey, getNextMonthKey, getPreviousMonthKey } from "@/lib/date";
import { useRouter, useParams } from "next/navigation";

interface HeaderProps {
    title?: string;
    showMonthNav?: boolean;
    yearMonth?: string;
    actions?: React.ReactNode;
}

export function Header({ title, showMonthNav, yearMonth, actions }: HeaderProps) {
    const router = useRouter();
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const currentYearMonth = yearMonth || getCurrentMonthKey();

    function navigateMonth(direction: "prev" | "next") {
        const newMonth = direction === "prev"
            ? getPreviousMonthKey(currentYearMonth)
            : getNextMonthKey(currentYearMonth);
        router.push(`/app/${workspaceId}/month/${newMonth}`);
    }

    return (
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {showMonthNav && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={() => navigateMonth("prev")}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-semibold text-white min-w-[180px] text-center capitalize">
                                {formatMonth(currentYearMonth, "pt-BR")}
                            </h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={() => navigateMonth("next")}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                    {title && !showMonthNav && (
                        <h1 className="text-xl font-semibold text-white">{title}</h1>
                    )}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </header>
    );
}

interface QuickActionsProps {
    onAddIncome?: () => void;
    onAddExpense?: () => void;
}

export function QuickActions({ onAddIncome, onAddExpense }: QuickActionsProps) {
    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                onClick={onAddIncome}
            >
                <Plus className="h-4 w-4 mr-1" />
                Receita
            </Button>
            <Button
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={onAddExpense}
            >
                <Plus className="h-4 w-4 mr-1" />
                Despesa
            </Button>
        </div>
    );
}
