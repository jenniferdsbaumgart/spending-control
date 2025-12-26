"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, CreditCard, Check } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { createInstallment, postInstallment } from "@/server/actions/installments";
import { toast } from "sonner";
import type { InstallmentPlanWithDetails, FinancialAccountInfo, BudgetGroupWithCategories } from "@/types";

interface InstallmentsClientProps {
    workspaceId: string;
    plans: InstallmentPlanWithDetails[];
    accounts: FinancialAccountInfo[];
    budgetGroups: BudgetGroupWithCategories[];
}

export function InstallmentsClient({
    workspaceId,
    plans,
    accounts,
    budgetGroups,
}: InstallmentsClientProps) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const allCategories = budgetGroups.flatMap((g) =>
        g.categories.map((c) => ({ ...c, groupName: g.name }))
    );

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        setLoading(true);
        try {
            const result = await createInstallment(workspaceId, {
                description: formData.get("description") as string,
                merchant: formData.get("merchant") as string || undefined,
                totalAmount: Number(formData.get("totalAmount")),
                installmentsCount: Number(formData.get("installmentsCount")),
                firstDueDate: new Date(formData.get("firstDueDate") as string),
                accountId: formData.get("accountId") as string,
                categoryId: formData.get("categoryId") as string,
            });

            if (result.success) {
                toast.success("Parcelamento criado!");
                setCreateOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao criar parcelamento");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handlePost(transactionId: string) {
        const result = await postInstallment(workspaceId, transactionId);
        if (result.success) {
            toast.success("Parcela marcada como paga!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao marcar parcela");
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Parcelas"
                actions={
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova compra parcelada
                    </Button>
                }
            />

            <div className="flex-1 p-6 overflow-auto">
                {plans.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                                <CreditCard className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">
                                Nenhuma compra parcelada
                            </h3>
                            <p className="text-slate-400 mb-6">
                                Registre compras parceladas para acompanhar parcelas futuras.
                            </p>
                            <Button
                                onClick={() => setCreateOpen(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar parcelamento
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {plans.map((plan) => (
                            <Card key={plan.id} className="bg-slate-900/50 border-slate-800">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg text-white">{plan.description}</CardTitle>
                                            {plan.merchant && (
                                                <p className="text-sm text-slate-400">{plan.merchant}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-white">
                                                {formatCurrency(plan.totalAmount)}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "border-slate-700",
                                                    plan.remainingCount === 0
                                                        ? "text-green-400 border-green-500/30"
                                                        : "text-slate-400"
                                                )}
                                            >
                                                {plan.paidCount}/{plan.installmentsCount} pagas
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {plan.transactions.map((transaction) => (
                                            <div
                                                key={transaction.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg",
                                                    transaction.status === "POSTED"
                                                        ? "bg-green-500/10 border border-green-500/20"
                                                        : "bg-slate-800/50"
                                                )}
                                            >
                                                <div>
                                                    <p className="text-white font-medium">
                                                        Parcela {transaction.installmentNumber}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {formatDate(transaction.date, "dd MMM yyyy")}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-300">
                                                        {formatCurrency(transaction.amount)}
                                                    </span>
                                                    {transaction.status === "POSTED" ? (
                                                        <Check className="h-4 w-4 text-green-400" />
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-slate-400 hover:text-white"
                                                            onClick={() => handlePost(transaction.id)}
                                                        >
                                                            Pagar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Nova Compra Parcelada</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Descrição</Label>
                            <Input
                                name="description"
                                placeholder="Ex: TV Samsung 55"
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Loja (opcional)</Label>
                            <Input
                                name="merchant"
                                placeholder="Ex: Magazine Luiza"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Valor total</Label>
                                <Input
                                    name="totalAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="2999.00"
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Parcelas</Label>
                                <Input
                                    name="installmentsCount"
                                    type="number"
                                    min="2"
                                    max="48"
                                    placeholder="12"
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Data da primeira parcela</Label>
                            <Input
                                name="firstDueDate"
                                type="date"
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Conta/Cartão</Label>
                            <Select name="accountId" required>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {accounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id} className="text-white">
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Categoria</Label>
                            <Select name="categoryId" required>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {allCategories.map((c) => (
                                        <SelectItem key={c.id} value={c.id} className="text-white">
                                            {c.groupName} → {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCreateOpen(false)}
                                className="text-slate-400"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                {loading ? "Criando..." : "Criar parcelamento"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
