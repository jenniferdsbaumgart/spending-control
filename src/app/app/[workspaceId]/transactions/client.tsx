"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    ArrowLeftRight,
    Filter,
    X,
    Calendar,
    Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { QuickAddModal } from "@/components/transactions/quick-add-modal";
import type {
    TransactionWithRelations,
    FinancialAccountInfo,
    BudgetGroupWithCategories,
    TransactionType,
} from "@/types";

interface TransactionsClientProps {
    workspaceId: string;
    initialTransactions: TransactionWithRelations[];
    accounts: FinancialAccountInfo[];
    budgetGroups: BudgetGroupWithCategories[];
}

type PeriodFilter = "all" | "today" | "week" | "month" | "year" | "custom";
type TypeFilter = "all" | "INCOME" | "EXPENSE" | "TRANSFER";

export function TransactionsClient({
    workspaceId,
    initialTransactions,
    accounts,
    budgetGroups,
}: TransactionsClientProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<TransactionType>("EXPENSE");

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [accountFilter, setAccountFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [customDateStart, setCustomDateStart] = useState("");
    const [customDateEnd, setCustomDateEnd] = useState("");

    function openModal(type: TransactionType) {
        setModalType(type);
        setModalOpen(true);
    }

    // Get all categories from budget groups
    const allCategories = useMemo(() => {
        return budgetGroups.flatMap((group) =>
            group.categories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                groupName: group.name,
                groupColor: group.color,
            }))
        );
    }, [budgetGroups]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return initialTransactions.filter((transaction) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesDescription = transaction.description?.toLowerCase().includes(query);
                const matchesCategory = transaction.category?.name.toLowerCase().includes(query);
                const matchesAccount = transaction.account.name.toLowerCase().includes(query);
                if (!matchesDescription && !matchesCategory && !matchesAccount) {
                    return false;
                }
            }

            // Period filter
            if (periodFilter !== "all") {
                const txDate = new Date(transaction.date);
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                switch (periodFilter) {
                    case "today":
                        if (txDate < startOfDay || txDate >= new Date(startOfDay.getTime() + 86400000)) {
                            return false;
                        }
                        break;
                    case "week":
                        const weekAgo = new Date(startOfDay.getTime() - 7 * 86400000);
                        if (txDate < weekAgo) return false;
                        break;
                    case "month":
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        if (txDate < monthStart) return false;
                        break;
                    case "year":
                        const yearStart = new Date(now.getFullYear(), 0, 1);
                        if (txDate < yearStart) return false;
                        break;
                    case "custom":
                        if (customDateStart && txDate < new Date(customDateStart)) return false;
                        if (customDateEnd && txDate > new Date(customDateEnd + "T23:59:59")) return false;
                        break;
                }
            }

            // Type filter
            if (typeFilter !== "all" && transaction.type !== typeFilter) {
                return false;
            }

            // Account filter
            if (accountFilter !== "all" && transaction.accountId !== accountFilter) {
                return false;
            }

            // Category filter
            if (categoryFilter !== "all") {
                if (categoryFilter === "uncategorized") {
                    if (transaction.categoryId) return false;
                } else if (transaction.categoryId !== categoryFilter) {
                    return false;
                }
            }

            return true;
        });
    }, [
        initialTransactions,
        searchQuery,
        periodFilter,
        typeFilter,
        accountFilter,
        categoryFilter,
        customDateStart,
        customDateEnd,
    ]);

    // Calculate totals for filtered transactions
    const totals = useMemo(() => {
        const income = filteredTransactions
            .filter((t) => t.type === "INCOME")
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = filteredTransactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expenses, balance: income - expenses };
    }, [filteredTransactions]);

    const activeFiltersCount = [
        periodFilter !== "all",
        typeFilter !== "all",
        accountFilter !== "all",
        categoryFilter !== "all",
        searchQuery.length > 0,
    ].filter(Boolean).length;

    function clearFilters() {
        setSearchQuery("");
        setPeriodFilter("all");
        setTypeFilter("all");
        setAccountFilter("all");
        setCategoryFilter("all");
        setCustomDateStart("");
        setCustomDateEnd("");
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
                            className="bg-gradient-to-r from-primary to-teal-400 hover:from-primary/90 hover:to-teal-500 text-primary-foreground"
                            onClick={() => openModal("EXPENSE")}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Despesa
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 p-6 overflow-auto space-y-4">
                {/* Search and Filter Bar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por descrição, categoria ou conta..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background/50 border-border text-foreground"
                        />
                    </div>

                    <Popover open={showFilters} onOpenChange={setShowFilters}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "border-border text-muted-foreground",
                                    activeFiltersCount > 0 && "border-primary text-primary"
                                )}
                            >
                                <Filter className="h-4 w-4 mr-1" />
                                Filtros
                                {activeFiltersCount > 0 && (
                                    <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-background border-border" align="end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-foreground">Filtros</h4>
                                    {activeFiltersCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Limpar
                                        </Button>
                                    )}
                                </div>

                                {/* Period Filter */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">Período</Label>
                                    <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                                        <SelectTrigger className="bg-background/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="today">Hoje</SelectItem>
                                            <SelectItem value="week">Últimos 7 dias</SelectItem>
                                            <SelectItem value="month">Este mês</SelectItem>
                                            <SelectItem value="year">Este ano</SelectItem>
                                            <SelectItem value="custom">Personalizado</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {periodFilter === "custom" && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">De</Label>
                                                <Input
                                                    type="date"
                                                    value={customDateStart}
                                                    onChange={(e) => setCustomDateStart(e.target.value)}
                                                    className="bg-background/50 border-border text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Até</Label>
                                                <Input
                                                    type="date"
                                                    value={customDateEnd}
                                                    onChange={(e) => setCustomDateEnd(e.target.value)}
                                                    className="bg-background/50 border-border text-foreground"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Type Filter */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">Tipo</Label>
                                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                                        <SelectTrigger className="bg-background/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="INCOME">
                                                <span className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-400" />
                                                    Receitas
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="EXPENSE">
                                                <span className="flex items-center gap-2">
                                                    <TrendingDown className="h-4 w-4 text-red-400" />
                                                    Despesas
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="TRANSFER">
                                                <span className="flex items-center gap-2">
                                                    <ArrowLeftRight className="h-4 w-4 text-blue-400" />
                                                    Transferências
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Account Filter */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">Conta</Label>
                                    <Select value={accountFilter} onValueChange={setAccountFilter}>
                                        <SelectTrigger className="bg-background/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border">
                                            <SelectItem value="all">Todas as contas</SelectItem>
                                            {accounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                account.type === "BANK" && "bg-blue-400",
                                                                account.type === "CREDIT" && "bg-purple-400",
                                                                account.type === "CASH" && "bg-green-400",
                                                                account.type === "INVESTMENT" && "bg-amber-400"
                                                            )}
                                                        />
                                                        {account.name}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({account.type === "BANK" ? "Banco" :
                                                                account.type === "CREDIT" ? "Cartão" :
                                                                    account.type === "CASH" ? "Dinheiro" : "Investimento"})
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">Categoria</Label>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="bg-background/50 border-border text-foreground">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border-border max-h-60">
                                            <SelectItem value="all">Todas as categorias</SelectItem>
                                            <SelectItem value="uncategorized">Sem categoria</SelectItem>
                                            {allCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    <span className="flex items-center gap-2">
                                                        {category.groupColor && (
                                                            <span
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: category.groupColor }}
                                                            />
                                                        )}
                                                        {category.name}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({category.groupName})
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Active Filters Tags */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                        {periodFilter !== "all" && (
                            <Badge variant="secondary" className="bg-secondary text-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                {periodFilter === "today" ? "Hoje" :
                                    periodFilter === "week" ? "7 dias" :
                                        periodFilter === "month" ? "Este mês" :
                                            periodFilter === "year" ? "Este ano" : "Personalizado"}
                                <button onClick={() => setPeriodFilter("all")} className="ml-1 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {typeFilter !== "all" && (
                            <Badge variant="secondary" className="bg-secondary text-foreground">
                                {typeFilter === "INCOME" ? "Receitas" : typeFilter === "EXPENSE" ? "Despesas" : "Transferências"}
                                <button onClick={() => setTypeFilter("all")} className="ml-1 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {accountFilter !== "all" && (
                            <Badge variant="secondary" className="bg-secondary text-foreground">
                                {accounts.find((a) => a.id === accountFilter)?.name}
                                <button onClick={() => setAccountFilter("all")} className="ml-1 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                        {categoryFilter !== "all" && (
                            <Badge variant="secondary" className="bg-secondary text-foreground">
                                {categoryFilter === "uncategorized" ? "Sem categoria" : allCategories.find((c) => c.id === categoryFilter)?.name}
                                <button onClick={() => setCategoryFilter("all")} className="ml-1 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>
                )}

                {/* Summary Card */}
                {filteredTransactions.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card rounded-lg p-4 border border-border">
                            <p className="text-sm text-muted-foreground">Receitas</p>
                            <p className="text-xl font-bold text-green-400">
                                +{formatCurrency(totals.income)}
                            </p>
                        </div>
                        <div className="glass-card rounded-lg p-4 border border-border">
                            <p className="text-sm text-muted-foreground">Despesas</p>
                            <p className="text-xl font-bold text-red-400">
                                -{formatCurrency(totals.expenses)}
                            </p>
                        </div>
                        <div className="glass-card rounded-lg p-4 border border-border">
                            <p className="text-sm text-muted-foreground">Saldo</p>
                            <p className={cn(
                                "text-xl font-bold",
                                totals.balance >= 0 ? "text-green-400" : "text-red-400"
                            )}>
                                {totals.balance >= 0 ? "+" : ""}{formatCurrency(totals.balance)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results info */}
                <div className="text-sm text-muted-foreground">
                    {filteredTransactions.length === initialTransactions.length ? (
                        <span>{filteredTransactions.length} transações</span>
                    ) : (
                        <span>
                            Mostrando {filteredTransactions.length} de {initialTransactions.length} transações
                        </span>
                    )}
                </div>

                {/* Transactions List */}
                {filteredTransactions.length === 0 ? (
                    <Card className="glass-card border-border">
                        <CardContent className="py-16 text-center">
                            {initialTransactions.length === 0 ? (
                                <>
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                        <Receipt className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        Nenhuma transação ainda
                                    </h3>
                                    <p className="text-muted-foreground mb-6">
                                        Suas transações aparecerão aqui quando você começar a registrar.
                                    </p>
                                    <Button
                                        onClick={() => openModal("EXPENSE")}
                                        className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar transação
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                        <Filter className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        Nenhum resultado
                                    </h3>
                                    <p className="text-muted-foreground mb-6">
                                        Tente ajustar os filtros para encontrar o que procura.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                        className="border-border text-muted-foreground"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Limpar filtros
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="glass-card border-border">
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {filteredTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                                {typeIcons[transaction.type]}
                                            </div>
                                            <div>
                                                <p className="text-foreground font-medium">
                                                    {transaction.description || transaction.category?.name || "Sem descrição"}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <span>{formatDate(transaction.date, "dd MMM yyyy")}</span>
                                                    <span>•</span>
                                                    <span>{transaction.account.name}</span>
                                                    {transaction.category && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                {transaction.category.group.color && (
                                                                    <span
                                                                        className="w-2 h-2 rounded-full"
                                                                        style={{ backgroundColor: transaction.category.group.color }}
                                                                    />
                                                                )}
                                                                {transaction.category.name}
                                                            </span>
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
