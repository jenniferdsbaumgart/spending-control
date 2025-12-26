"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createWorkspace } from "@/server/actions/workspace";
import { createBudgetGroup, createCategory } from "@/server/actions/budgets";
import { createAccount } from "@/server/actions/accounts";
import { toast } from "sonner";

interface BudgetGroupInput {
    name: string;
    percent: number;
    categories: string[];
}

const defaultGroups: BudgetGroupInput[] = [
    { name: "Essenciais", percent: 50, categories: ["Moradia", "Alimentação", "Transporte", "Saúde"] },
    { name: "Estilo de Vida", percent: 30, categories: ["Lazer", "Compras", "Educação"] },
    { name: "Investimentos", percent: 20, categories: ["Poupança", "Aposentadoria", "Investimentos"] },
];

const defaultAccounts = [
    { name: "Dinheiro", type: "CASH" as const, isDefault: false },
    { name: "Conta Corrente", type: "BANK" as const, isDefault: true },
    { name: "Cartão de Crédito", type: "CREDIT" as const, isDefault: false },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [groups, setGroups] = useState<BudgetGroupInput[]>(defaultGroups);

    const totalPercent = groups.reduce((sum, g) => sum + g.percent, 0);

    function updateGroup(index: number, field: keyof BudgetGroupInput, value: string | number) {
        const newGroups = [...groups];
        if (field === "percent") {
            newGroups[index].percent = Number(value);
        } else if (field === "name") {
            newGroups[index].name = value as string;
        }
        setGroups(newGroups);
    }

    function addGroup() {
        setGroups([...groups, { name: "", percent: 0, categories: [] }]);
    }

    function removeGroup(index: number) {
        setGroups(groups.filter((_, i) => i !== index));
    }

    async function handleComplete() {
        if (!workspaceName.trim()) {
            toast.error("Digite o nome do espaço");
            return;
        }

        setLoading(true);
        try {
            // Create workspace
            const wsResult = await createWorkspace({
                name: workspaceName,
                defaultCurrency: "BRL",
            });

            if (!wsResult.success || !wsResult.data) {
                toast.error(wsResult.error || "Erro ao criar espaço");
                return;
            }

            const workspaceId = wsResult.data.id;

            // Create budget groups and categories
            for (const group of groups) {
                if (!group.name.trim()) continue;

                const groupResult = await createBudgetGroup(workspaceId, {
                    name: group.name,
                    defaultPercent: group.percent,
                });

                if (groupResult.success && groupResult.data) {
                    for (const categoryName of group.categories) {
                        await createCategory(workspaceId, {
                            name: categoryName,
                            groupId: groupResult.data.id,
                        });
                    }
                }
            }

            // Create default accounts
            for (const account of defaultAccounts) {
                await createAccount(workspaceId, account);
            }

            toast.success("Espaço criado com sucesso!");
            router.push(`/app/${workspaceId}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao configurar espaço");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-white">
                        {step === 1 ? "Vamos configurar seu espaço" : "Configure seus grupos de orçamento"}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                        {step === 1
                            ? "Um espaço é onde você organiza suas finanças. Você pode convidar outras pessoas para colaborar."
                            : "Divida sua renda em grupos. Os percentuais devem somar 100%."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="workspaceName" className="text-gray-200">
                                    Nome do espaço
                                </Label>
                                <Input
                                    id="workspaceName"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    placeholder="Ex: Casa, Família, Pessoal"
                                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                />
                            </div>
                            <Button
                                onClick={() => setStep(2)}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                disabled={!workspaceName.trim()}
                            >
                                Próximo
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {groups.map((group, index) => (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <Input
                                                value={group.name}
                                                onChange={(e) => updateGroup(index, "name", e.target.value)}
                                                placeholder="Nome do grupo"
                                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={group.percent}
                                                    onChange={(e) => updateGroup(index, "percent", e.target.value)}
                                                    min={0}
                                                    max={100}
                                                    className="bg-white/10 border-white/20 text-white pr-8"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                                            </div>
                                        </div>
                                        {groups.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeGroup(index)}
                                                className="text-gray-400 hover:text-white hover:bg-white/10"
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant="ghost"
                                onClick={addGroup}
                                className="w-full text-purple-400 hover:text-purple-300 hover:bg-white/5"
                            >
                                + Adicionar grupo
                            </Button>

                            {totalPercent !== 100 && (
                                <p className="text-amber-400 text-sm text-center">
                                    Os percentuais somam {totalPercent}%. O ideal é que somem 100%.
                                </p>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="flex-1 text-white hover:bg-white/10"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleComplete}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    disabled={loading}
                                >
                                    {loading ? "Criando..." : "Concluir"}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
