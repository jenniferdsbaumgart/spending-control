"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCenter,
    useSensor,
    useSensors,
    PointerSensor,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ui/color-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    createBudgetGroup,
    createCategory,
    updateGroupPercentages,
    updateGroupColor,
    moveCategory,
} from "@/server/actions/budgets";
import { toast } from "sonner";
import type { BudgetGroupWithCategories, CategoryInfo } from "@/types";

interface BudgetsClientProps {
    workspaceId: string;
    budgetGroups: BudgetGroupWithCategories[];
}

interface DraggableCategoryProps {
    category: CategoryInfo;
    groupColor: string | null;
}

function DraggableCategory({ category, groupColor }: DraggableCategoryProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: category.id,
        data: { type: "category", category },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between py-2 px-4 rounded-lg bg-secondary/30 group transition-all",
                isDragging && "opacity-50 shadow-lg z-50"
            )}
            {...listeners}
            {...attributes}
        >
            <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                {groupColor && (
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: groupColor }}
                    />
                )}
                <span className="text-muted-foreground">{category.name}</span>
            </div>
        </div>
    );
}

interface DroppableGroupProps {
    groupId: string;
    children: React.ReactNode;
    isOver?: boolean;
}

function DroppableGroup({ groupId, children, isOver }: DroppableGroupProps) {
    const { setNodeRef, isOver: dropping } = useDroppable({
        id: groupId,
        data: { type: "group", groupId },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "space-y-2 transition-all min-h-[40px] rounded-lg p-1",
                (isOver || dropping) && "bg-primary/10 ring-2 ring-primary/40"
            )}
        >
            {children}
        </div>
    );
}

export function BudgetsClient({ workspaceId, budgetGroups }: BudgetsClientProps) {
    const router = useRouter();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(budgetGroups.map((g) => g.id))
    );
    const [percentages, setPercentages] = useState<Record<string, number>>(
        Object.fromEntries(budgetGroups.map((g) => [g.id, g.defaultPercent]))
    );
    const [hasChanges, setHasChanges] = useState(false);
    const [activeCategory, setActiveCategory] = useState<CategoryInfo | null>(null);

    // Modal states
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

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

    async function handleColorChange(groupId: string, color: string) {
        const result = await updateGroupColor(workspaceId, groupId, color);
        if (result.success) {
            toast.success("Cor atualizada!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao atualizar cor");
        }
    }

    function openAddGroupModal() {
        setNewGroupName("");
        setShowGroupModal(true);
    }

    async function handleAddGroup() {
        if (!newGroupName.trim()) return;

        setIsSubmitting(true);
        const result = await createBudgetGroup(workspaceId, {
            name: newGroupName.trim(),
            defaultPercent: 0,
        });

        setIsSubmitting(false);
        if (result.success) {
            toast.success("Grupo criado!");
            setShowGroupModal(false);
            setNewGroupName("");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao criar grupo");
        }
    }

    function openAddCategoryModal(groupId: string) {
        setSelectedGroupId(groupId);
        setNewCategoryName("");
        setShowCategoryModal(true);
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim() || !selectedGroupId) return;

        setIsSubmitting(true);
        const result = await createCategory(workspaceId, {
            name: newCategoryName.trim(),
            groupId: selectedGroupId,
        });

        setIsSubmitting(false);
        if (result.success) {
            toast.success("Categoria criada!");
            setShowCategoryModal(false);
            setNewCategoryName("");
            setSelectedGroupId(null);
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao criar categoria");
        }
    }

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        if (active.data.current?.type === "category") {
            setActiveCategory(active.data.current.category);
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveCategory(null);

        if (!over || active.id === over.id) return;

        const categoryId = active.id as string;
        const newGroupId = over.id as string;

        const currentGroup = budgetGroups.find((g) =>
            g.categories.some((c) => c.id === categoryId)
        );

        if (!currentGroup || currentGroup.id === newGroupId) return;

        const targetGroup = budgetGroups.find((g) => g.id === newGroupId);
        if (!targetGroup) return;

        const result = await moveCategory(workspaceId, categoryId, newGroupId);
        if (result.success) {
            toast.success("Categoria movida!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao mover categoria");
        }
    }

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col h-full">
                    <Header
                        title="Orçamentos"
                        actions={
                            <div className="flex gap-2">
                                {hasChanges && (
                                    <Button
                                        size="sm"
                                        onClick={savePercentages}
                                        className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground hover:from-primary/90 hover:to-teal-500"
                                    >
                                        Salvar alterações
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                                    onClick={openAddGroupModal}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Novo grupo
                                </Button>
                            </div>
                        }
                    />

                    <div className="flex-1 p-6 overflow-auto space-y-4">
                        {totalPercent !== 100 && (
                            <div
                                className={cn(
                                    "px-4 py-3 rounded-lg text-sm",
                                    totalPercent > 100
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                )}
                            >
                                Os percentuais somam {totalPercent}%. O ideal é que somem 100%.
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground px-1">
                            💡 Arraste categorias entre grupos para reorganizar. Clique na bolinha colorida para mudar a cor do grupo.
                        </div>

                        {budgetGroups.length === 0 ? (
                            <Card className="glass-card border-border">
                                <CardContent className="py-16 text-center">
                                    <h3 className="text-lg font-medium text-white mb-2">
                                        Nenhum grupo de orçamento
                                    </h3>
                                    <p className="text-muted-foreground mb-6">
                                        Crie grupos para organizar suas despesas por categoria.
                                    </p>
                                    <Button
                                        onClick={openAddGroupModal}
                                        className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground hover:from-primary/90 hover:to-teal-500"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Criar grupo
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            budgetGroups.map((group) => {
                                const isExpanded = expandedGroups.has(group.id);

                                return (
                                    <Card key={group.id} className="glass-card border-border">
                                        <CardHeader className="cursor-pointer" onClick={() => toggleGroup(group.id)}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <ColorPicker
                                                            color={group.color}
                                                            onChange={(color) => handleColorChange(group.id, color)}
                                                        />
                                                    </div>
                                                    <CardTitle className="text-lg text-foreground">{group.name}</CardTitle>
                                                    <Badge variant="outline" className="border-border text-muted-foreground">
                                                        {group.categories.length} categorias
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        type="number"
                                                        value={percentages[group.id] ?? 0}
                                                        onChange={(e) => updatePercent(group.id, Number(e.target.value))}
                                                        className="w-20 bg-background/50 border-border text-foreground text-center"
                                                        min={0}
                                                        max={100}
                                                    />
                                                    <span className="text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        {isExpanded && (
                                            <CardContent className="pt-0">
                                                <DroppableGroup groupId={group.id}>
                                                    {group.categories.map((category) => (
                                                        <DraggableCategory
                                                            key={category.id}
                                                            category={category}
                                                            groupColor={group.color}
                                                        />
                                                    ))}
                                                    {group.categories.length === 0 && (
                                                        <div className="py-4 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                                                            Arraste categorias aqui
                                                        </div>
                                                    )}
                                                </DroppableGroup>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full mt-2 text-muted-foreground hover:text-foreground"
                                                    onClick={() => openAddCategoryModal(group.id)}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Adicionar categoria
                                                </Button>
                                            </CardContent>
                                        )}
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {activeCategory ? (
                        <div className="py-2 px-4 rounded-lg bg-primary/20 border border-primary shadow-xl">
                            <span className="text-foreground font-medium">{activeCategory.name}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Add Group Modal */}
            <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
                <DialogContent className="bg-background border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Novo Grupo de Orçamento</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Crie um grupo para organizar suas categorias de despesas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="groupName" className="text-foreground">Nome do grupo</Label>
                            <Input
                                id="groupName"
                                placeholder="Ex: Essenciais, Lazer, Investimentos..."
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                className="bg-background/50 border-border text-foreground"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && newGroupName.trim()) {
                                        handleAddGroup();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowGroupModal(false)}
                            className="border-border text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddGroup}
                            disabled={!newGroupName.trim() || isSubmitting}
                            className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                        >
                            {isSubmitting ? "Criando..." : "Criar grupo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Category Modal */}
            <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                <DialogContent className="bg-background border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Nova Categoria</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Adicione uma categoria para classificar suas transações.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName" className="text-foreground">Nome da categoria</Label>
                            <Input
                                id="categoryName"
                                placeholder="Ex: Alimentação, Transporte, Streaming..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="bg-background/50 border-border text-foreground"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && newCategoryName.trim()) {
                                        handleAddCategory();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCategoryModal(false)}
                            className="border-border text-muted-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim() || isSubmitting}
                            className="bg-gradient-to-r from-primary to-teal-400 text-primary-foreground"
                        >
                            {isSubmitting ? "Criando..." : "Criar categoria"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
