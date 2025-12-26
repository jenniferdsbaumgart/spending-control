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
import { createTransaction } from "@/server/actions/transactions";
import { toast } from "sonner";
import type { FinancialAccountInfo, BudgetGroupWithCategories, TransactionType } from "@/types";

interface QuickAddModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    type: TransactionType;
    accounts: FinancialAccountInfo[];
    budgetGroups: BudgetGroupWithCategories[];
}

export function QuickAddModal({
    open,
    onOpenChange,
    workspaceId,
    type,
    accounts,
    budgetGroups,
}: QuickAddModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [accountId, setAccountId] = useState(accounts.find((a) => a.isDefault)?.id || "");
    const [categoryId, setCategoryId] = useState("");

    const isExpense = type === "EXPENSE";
    const allCategories = budgetGroups.flatMap((g) =>
        g.categories.map((c) => ({ ...c, groupName: g.name }))
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

    function resetForm() {
        setAmount("");
        setDescription("");
        setCategoryId("");
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
                            placeholder="Ex: Supermercado"
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
                                            {category.groupName} → {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
