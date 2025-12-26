"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { UserPlus, Trash2 } from "lucide-react";
import { updateWorkspace, inviteMember, updateMemberRole, removeMember } from "@/server/actions/workspace";
import { toast } from "sonner";
import type { WorkspaceMemberInfo, Role } from "@/types";

interface SettingsClientProps {
    workspaceId: string;
    workspace: {
        id: string;
        name: string;
        defaultCurrency: string;
        role: Role;
    };
    members: WorkspaceMemberInfo[];
}

const roleLabels: Record<Role, string> = {
    ADMIN: "Administrador",
    EDITOR: "Editor",
    VIEWER: "Visualizador",
};

const roleColors: Record<Role, string> = {
    ADMIN: "text-purple-400 border-purple-500/30",
    EDITOR: "text-blue-400 border-blue-500/30",
    VIEWER: "text-slate-400 border-slate-500/30",
};

export function SettingsClient({ workspaceId, workspace, members }: SettingsClientProps) {
    const router = useRouter();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [workspaceName, setWorkspaceName] = useState(workspace.name);

    const isAdmin = workspace.role === "ADMIN";

    async function handleUpdateName() {
        if (workspaceName === workspace.name) return;

        const result = await updateWorkspace(workspaceId, { name: workspaceName });
        if (result.success) {
            toast.success("Nome atualizado!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao atualizar");
        }
    }

    async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        setLoading(true);
        try {
            const result = await inviteMember(workspaceId, {
                email: formData.get("email") as string,
                role: formData.get("role") as Role,
            });

            if (result.success) {
                toast.success("Membro convidado!");
                setInviteOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao convidar");
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleRoleChange(memberId: string, newRole: Role) {
        const result = await updateMemberRole(workspaceId, { memberId, role: newRole });
        if (result.success) {
            toast.success("Função atualizada!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao atualizar função");
        }
    }

    async function handleRemove(memberId: string) {
        if (!confirm("Remover este membro?")) return;

        const result = await removeMember(workspaceId, memberId);
        if (result.success) {
            toast.success("Membro removido!");
            router.refresh();
        } else {
            toast.error(result.error || "Erro ao remover");
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Configurações" />

            <div className="flex-1 p-6 overflow-auto space-y-6">
                {/* Workspace Settings */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Espaço de Trabalho</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Nome do espaço</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    disabled={!isAdmin}
                                />
                                {isAdmin && workspaceName !== workspace.name && (
                                    <Button onClick={handleUpdateName}>Salvar</Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Members */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg text-white">Membros</CardTitle>
                            <CardDescription className="text-slate-400">
                                Gerencie quem tem acesso a este espaço
                            </CardDescription>
                        </div>
                        {isAdmin && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 text-slate-300"
                                onClick={() => setInviteOpen(true)}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Convidar
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                >
                                    <div>
                                        <p className="text-white font-medium">
                                            {member.user.name || member.user.email}
                                        </p>
                                        <p className="text-sm text-slate-400">{member.user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAdmin ? (
                                            <Select
                                                value={member.role}
                                                onValueChange={(value) => handleRoleChange(member.id, value as Role)}
                                            >
                                                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                    <SelectItem value="ADMIN" className="text-white">
                                                        Administrador
                                                    </SelectItem>
                                                    <SelectItem value="EDITOR" className="text-white">
                                                        Editor
                                                    </SelectItem>
                                                    <SelectItem value="VIEWER" className="text-white">
                                                        Visualizador
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant="outline" className={roleColors[member.role]}>
                                                {roleLabels[member.role]}
                                            </Badge>
                                        )}
                                        {isAdmin && members.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-slate-400 hover:text-red-400"
                                                onClick={() => handleRemove(member.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invite Modal */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Convidar Membro</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">E-mail</Label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="email@exemplo.com"
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Função</Label>
                            <Select name="role" defaultValue="VIEWER">
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="ADMIN" className="text-white">
                                        <div>
                                            <p>Administrador</p>
                                            <p className="text-xs text-slate-400">Acesso total</p>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="EDITOR" className="text-white">
                                        <div>
                                            <p>Editor</p>
                                            <p className="text-xs text-slate-400">Pode criar e editar</p>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="VIEWER" className="text-white">
                                        <div>
                                            <p>Visualizador</p>
                                            <p className="text-xs text-slate-400">Apenas leitura</p>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setInviteOpen(false)}
                                className="text-slate-400"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                {loading ? "Convidando..." : "Enviar convite"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
