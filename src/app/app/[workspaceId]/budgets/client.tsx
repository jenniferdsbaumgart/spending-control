"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { formatPercent } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { createBudgetGroup, createCategory, updateGroupPercentages } from "@/server/actions/budgets";
import { toast } from "sonner";
import type { BudgetGroupWithCategories } from "@/types";

interface BudgetsClientProps {
    workspaceId: string;
    budgetGroups: BudgetGroupWithCategories[];
}

export function BudgetsClient({ workspaceId, budgetGroups }: BudgetsClientProps) {
    const router = useRouter();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [percentages, setPercentages] = useState<Record<string, number>>(
        Object.fromEntries(budgetGroups.map((g) => [g.id, g.defaultPercent]))
    );
    const [hasChanges, setHasChanges] = useState(false);

    const totalPercent = Object.values(percentages).reduce((sum, p) => sum + p, 0);

    function toggleGroup(groupId: string) {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    }

    function updatePercent(groupId: string, value: number) {
        setPercentages({ ...percentages, [groupId]: value });
        setHasChanges(true);
    }

    async function savePercentages() {
        const updates = Object.entries(percentages).map(([groupId, percent]) => ({
            groupId,
            percent,
        }));

        const result = await updateGroupPercentages(workspaceId, updates);
        if (result.success) {
            toast.success("Percentuais atualizados!");
            setHasChanges(false);
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao atualizar");
        }
    }

    async function handleAddGroup() {
        const name = prompt("Nome do grupo:");
        if (!name) return;

        const result = await createBudgetGroup(workspaceId, {
            name,
            defaultPercent: 0,
        });

        if (result.success) {
            toast.success("Grupo criado!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao criar grupo");
        }
    }

    async function handleAddCategory(groupId: string) {
        const name = prompt("Nome da categoria:");
        if (!name) return;

        const result = await createCategory(workspaceId, {
            name,
            groupId,
        });

        if (result.success) {
            toast.success("Categoria criada!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao criar categoria");
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header
                title="Orçamentos"
                actions={
                    <div className="flex gap-2">
                        {hasChanges && (
                            <Button
                                size="sm"
                                onClick={savePercentages}
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                Salvar alterações
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={handleAddGroup}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Novo grupo
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 p-6 overflow-auto space-y-4">
                {/* Percent Warning */}
                {totalPercent !== 100 && (
                    <div className={cn(
                        "px-4 py-3 rounded-lg text-sm",
                        totalPercent > 100
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}>
                        Os percentuais somam {totalPercent}%. O ideal é que somem 100%.
                    </div>
                )}

                {/* Budget Groups */}
                {budgetGroups.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardContent className="py-16 text-center">
                            <h3 className="text-lg font-medium text-white mb-2">
                                Nenhum grupo de orçamento
                            </h3>
                            <p className="text-slate-400 mb-6">
                                Crie grupos para organizar suas despesas por categoria.
                            </p>
                            <Button onClick={handleAddGroup} className="bg-gradient-to-r from-purple-500 to-pink-500">
                                <Plus className="h-4 w-4 mr-2" />
                                Criar grupo
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    budgetGroups.map((group) => {
                        const isExpanded = expandedGroups.has(group.id);

                        return (
                            <Card key={group.id} className="bg-slate-900/50 border-slate-800">
                                <CardHeader
                                    className="cursor-pointer"
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            )}
                                            {group.color && (
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: group.color }}
                                                />
                                            )}
                                            <CardTitle className="text-lg text-white">{group.name}</CardTitle>
                                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                {group.categories.length} categorias
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                                type="number"
                                                value={percentages[group.id] ?? 0}
                                                onChange={(e) => updatePercent(group.id, Number(e.target.value))}
                                                className="w-20 bg-slate-800 border-slate-700 text-white text-center"
                                                min={0}
                                                max={100}
                                            />
                                            <span className="text-slate-400">%</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent className="pt-0">
                                        <div className="space-y-2">
                                            {group.categories.map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center justify-between py-2 px-4 rounded-lg bg-slate-800/50"
                                                >
                                                    <span className="text-slate-300">{category.name}</span>
                                                </div>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-slate-400 hover:text-white"
                                                onClick={() => handleAddCategory(group.id)}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Adicionar categoria
                                            </Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
