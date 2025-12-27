"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createTransaction } from "@/server/actions/transactions";
import { createIncomeCategory } from "@/server/actions/income-categories";
import { toast } from "sonner";
import type { FinancialAccountInfo, BudgetGroupWithCategories, TransactionType } from "@/types";
import type { IncomeCategoryInfo } from "@/server/actions/income-categories";

interface QuickAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    type: TransactionType;
    accounts: FinancialAccountInfo[];
    budgetGroups: BudgetGroupWithCategories[];
    incomeCategories?: IncomeCategoryInfo[];
}

export function QuickAddModal({
    open,
    onOpenChange,
    workspaceId,
    type,
    accounts,
    budgetGroups,
    incomeCategories = [],
}: QuickAddModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [accountId, setAccountId] = useState(accounts.find((a) => a.isDefault)?.id || "");
    const [categoryId, setCategoryId] = useState("");
    const [incomeCategoryId, setIncomeCategoryId] = useState("");
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const isExpense = type === "EXPENSE";
    const isIncome = type === "INCOME";
    const allCategories = budgetGroups.flatMap((g) =>
        g.categories.map((c) => ({ ...c, groupName: g.name, groupColor: g.color }))
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Digite um valor válido");
            return;
        }

        if (!accountId) {
            toast.error("Selecione uma conta");
            return;
        }

        if (isExpense && !categoryId) {
            toast.error("Selecione uma categoria");
            return;
        }

        setLoading(true);
        try {
            const result = await createTransaction(workspaceId, {
                date: new Date(),
                amount: parseFloat(amount),
                type,
                description: description || undefined,
                accountId,
                categoryId: isExpense ? categoryId : undefined,
                incomeCategoryId: isIncome ? incomeCategoryId : undefined,
                status: "POSTED",
            });

            if (result.success) {
                toast.success(isExpense ? "Despesa adicionada!" : "Receita adicionada!");
                onOpenChange(false);
                resetForm();
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao adicionar transação");
            }
        } catch {
            toast.error("Erro ao adicionar transação");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateIncomeCategory() {
        if (!newCategoryName.trim()) return;

        setLoading(true);
        try {
            const result = await createIncomeCategory(workspaceId, {
                name: newCategoryName.trim(),
            });

            if (result.success && result.data) {
                toast.success("Categoria criada!");
                setIncomeCategoryId(result.data.id);
                setNewCategoryName("");
                setShowNewCategoryInput(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao criar categoria");
            }
        } catch {
            toast.error("Erro ao criar categoria");
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setAmount("");
        setDescription("");
        setCategoryId("");
        setIncomeCategoryId("");
        setNewCategoryName("");
        setShowNewCategoryInput(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-popover border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {isExpense ? "Adicionar Despesa" : "Adicionar Receita"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isExpense
                            ? "Registre uma nova despesa"
                            : "Registre uma nova receita"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-muted-foreground">Valor</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-background border-input text-foreground"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-muted-foreground">Descrição (opcional)</Label>
                        <Input
                            id="description"
                            placeholder={isExpense ? "Ex: Supermercado" : "Ex: Salário dezembro"}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-background border-input text-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account" className="text-muted-foreground">Conta</Label>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger className="bg-background border-input text-foreground">
                                <SelectValue placeholder="Selecione uma conta" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id} className="text-foreground">
                                        {account.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {isExpense && (
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-muted-foreground">Categoria</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {allCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id} className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                {category.groupColor && (
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: category.groupColor }}
                                                    />
                                                )}
                                                {category.groupName} → {category.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {isIncome && (
                        <div className="space-y-2">
                            <Label htmlFor="incomeCategory" className="text-muted-foreground">
                                Categoria de Receita
                            </Label>

                            {showNewCategoryInput ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nome da nova categoria"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="bg-background border-input text-foreground"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleCreateIncomeCategory();
                                            }
                                            if (e.key === "Escape") {
                                                setShowNewCategoryInput(false);
                                                setNewCategoryName("");
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCreateIncomeCategory}
                                        disabled={!newCategoryName.trim() || loading}
                                        className="bg-primary text-primary-foreground"
                                    >
                                        Criar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowNewCategoryInput(false);
                                            setNewCategoryName("");
                                        }}
                                        className="text-muted-foreground"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            ) : (
                                <Select value={incomeCategoryId} onValueChange={(value) => {
                                    if (value === "__new__") {
                                        setShowNewCategoryInput(true);
                                    } else {
                                        setIncomeCategoryId(value);
                                    }
                                }}>
                                    <SelectTrigger className="bg-background border-input text-foreground">
                                        <SelectValue placeholder="Selecione uma categoria (opcional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        {/* Default income categories */}
                                        <SelectItem value="income-salary" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>💼</span>
                                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                                Salário
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="income-freelance" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>💻</span>
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                Freelance
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="income-investments" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>📈</span>
                                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                                Investimentos
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="income-gift" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>🎁</span>
                                                <span className="w-2 h-2 rounded-full bg-pink-500" />
                                                Presente
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="income-refund" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>↩️</span>
                                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                Reembolso
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="income-bonus" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>🏆</span>
                                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                Bônus
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="income-other" className="text-foreground">
                                            <span className="flex items-center gap-2">
                                                <span>📦</span>
                                                <span className="w-2 h-2 rounded-full bg-gray-500" />
                                                Outros
                                            </span>
                                        </SelectItem>

                                        {/* User-created categories */}
                                        {incomeCategories.filter(c => !c.id.startsWith("income-")).map((category) => (
                                            <SelectItem key={category.id} value={category.id} className="text-foreground">
                                                <span className="flex items-center gap-2">
                                                    {category.icon && <span>{category.icon}</span>}
                                                    {category.color && (
                                                        <span
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: category.color }}
                                                        />
                                                    )}
                                                    {category.name}
                                                </span>
                                            </SelectItem>
                                        ))}

                                        {/* Create new option */}
                                        <div className="border-t border-border mt-1 pt-1">
                                            <SelectItem value="__new__" className="text-primary">
                                                <span className="flex items-center gap-2">
                                                    <Plus className="h-4 w-4" />
                                                    Nova categoria...
                                                </span>
                                            </SelectItem>
                                        </div>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-primary to-teal-400 hover:from-primary/90 hover:to-teal-500 text-primary-foreground"
                        >
                            {loading ? "Adicionando..." : "Adicionar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
