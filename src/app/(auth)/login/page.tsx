"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginUser } from "@/server/actions/auth";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const result = await loginUser(formData);
            if (result.success) {
                toast.success("Login realizado com sucesso!");
                router.push("/app");
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao fazer login");
            }
        } catch {
            toast.error("Erro ao fazer login");
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
                <CardTitle className="text-2xl text-foreground">Bem-vindo de volta</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Entre na sua conta para continuar
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
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
                            placeholder="••••••••"
                            required
                            className="bg-background/20 border-white/10 text-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-teal-400 hover:from-primary/90 hover:to-teal-500 text-primary-foreground"
                        disabled={loading}
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-muted-foreground text-sm">
                    Não tem uma conta?{" "}
                    <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                        Criar conta
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
