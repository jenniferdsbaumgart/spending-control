"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Target, TrendingUp } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { createGoal, addContribution } from "@/server/actions/goals";
import { toast } from "sonner";
import type { GoalWithProgress } from "@/types";

interface GoalsClientProps {
    workspaceId: string;
    goals: GoalWithProgress[];
}

export function GoalsClient({ workspaceId, goals }: GoalsClientProps) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [contributeOpen, setContributeOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        setLoading(true);
        try {
            const result = await createGoal(workspaceId, {
                name: formData.get("name") as string,
                targetAmount: Number(formData.get("targetAmount")),
                initialAmount: Number(formData.get("initialAmount") || 0),
            });

            if (result.success) {
                toast.success("Meta criada!");
                setCreateOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao criar meta");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleContribute(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedGoal) return;

        const formData = new FormData(e.currentTarget);

        setLoading(true);
        try {
            const result = await addContribution(workspaceId, selectedGoal.id, {
                amount: Number(formData.get("amount")),
                date: new Date(),
                note: formData.get("note") as string || undefined,
            });

            if (result.success) {
                toast.success("Aporte registrado!");
                setContributeOpen(false);
                setSelectedGoal(null);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao registrar aporte");
            }
        } finally {
            setLoading(false);
        }
    }

    function openContribute(goal: GoalWithProgress) {
        setSelectedGoal(goal);
        setContributeOpen(true);
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Metas (Little Boxes)"
                actions={
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Nova meta
                    </Button>
                }
            />

            <div className="flex-1 p-6 overflow-auto">
                {goals.length === 0 ? (
                    <Card className="glass-card border-border">
                        <CardContent className="py-16 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                                <Target className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Nenhuma meta ainda
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Crie metas para guardar dinheiro para objetivos específicos.
                            </p>
                            <Button
                                onClick={() => setCreateOpen(true)}
                                className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Criar meta
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {goals.map((goal) => (
                            <Card
                                key={goal.id}
                                className={cn(
                                    "glass-card border-border",
                                    goal.isCompleted && "border-green-500/30"
                                )}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-foreground flex items-center justify-between">
                                        <span>{goal.name}</span>
                                        {goal.isCompleted && (
                                            <span className="text-green-400 text-sm">✓ Atingida!</span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">
                                                {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                                            </span>
                                            <span className="text-primary">
                                                {Math.round(goal.progressPercent)}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={goal.progressPercent}
                                            className={cn(
                                                "h-2",
                                                goal.isCompleted
                                                    ? "[&>div]:bg-green-500"
                                                    : "[&>div]:bg-primary"
                                            )}
                                        />
                                    </div>
                                    {!goal.isCompleted && (
                                        <div className="text-sm text-muted-foreground">
                                            Faltam: {formatCurrency(goal.remainingAmount)}
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                                        onClick={() => openContribute(goal)}
                                        disabled={goal.isCompleted}
                                    >
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Adicionar aporte
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Goal Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="glass-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Nova Meta</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-foreground">Nome da meta</Label>
                            <Input
                                name="name"
                                placeholder="Ex: Fundo de emergência"
                                className="bg-background/20 border-border text-foreground"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground">Valor alvo</Label>
                            <Input
                                name="targetAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="10000.00"
                                className="bg-background/20 border-border text-foreground"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground">Valor inicial (opcional)</Label>
                            <Input
                                name="initialAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="bg-background/20 border-border text-foreground"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCreateOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                            >
                                {loading ? "Criando..." : "Criar meta"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Contribute Modal */}
            <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
                <DialogContent className="glass-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            Aporte para: {selectedGoal?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleContribute} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-foreground">Valor do aporte</Label>
                            <Input
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="100.00"
                                className="bg-background/20 border-border text-foreground"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground">Observação (opcional)</Label>
                            <Input
                                name="note"
                                placeholder="Ex: Bônus do trabalho"
                                className="bg-background/20 border-border text-foreground"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setContributeOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                            >
                                {loading ? "Registrando..." : "Registrar aporte"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
