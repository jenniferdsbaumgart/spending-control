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
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">$</span>
                </div>
                <CardTitle className="text-2xl text-white">Crie sua conta</CardTitle>
                <CardDescription className="text-gray-300">
                    Comece a controlar suas finanças hoje
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-200">Nome</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Seu nome"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-200">E-mail</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-gray-200">Senha</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            required
                            minLength={8}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-gray-200">Confirmar senha</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        disabled={loading}
                    >
                        {loading ? "Criando conta..." : "Criar conta"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-gray-300 text-sm">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                        Entrar
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
