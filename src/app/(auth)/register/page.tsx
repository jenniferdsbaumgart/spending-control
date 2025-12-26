"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser } from "@/server/actions/auth";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setLoading(true);
        try {
            const result = await registerUser(formData);
            if (result.success) {
                toast.success("Conta criada com sucesso!");
                router.push("/onboarding");
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao criar conta");
            }
        } catch {
            toast.error("Erro ao criar conta");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="glass-card border-white/10">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center mb-4">
                    <span className="text-primary-foreground font-bold text-xl">$</span>
                </div>
                <CardTitle className="text-2xl text-foreground">Crie sua conta</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Comece a controlar suas finanças hoje
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">Nome</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Seu nome"
                            required
                            className="bg-background/20 border-white/10 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">E-mail</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            className="bg-background/20 border-white/10 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-foreground">Senha</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            required
                            minLength={8}
                            className="bg-background/20 border-white/10 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-foreground">Confirmar senha</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            className="bg-background/20 border-white/10 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-teal-400 hover:from-primary/90 hover:to-teal-500 text-primary-foreground"
                        disabled={loading}
                    >
                        {loading ? "Criando conta..." : "Criar conta"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-muted-foreground text-sm">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                        Entrar
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
