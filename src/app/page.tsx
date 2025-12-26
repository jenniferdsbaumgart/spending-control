import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-xl">$</span>
            </div>
            <span className="text-white font-semibold text-xl">Spending Control</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Criar conta
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center text-center mt-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Controle suas finanças
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              com clareza
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl">
            Organize seu orçamento mensal por grupos, acompanhe metas e parcelas.
            Sem integração bancária, sem complicação. Você no controle.
          </p>
          <div className="flex gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-6">
                Começar grátis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 text-lg px-8 py-6">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Orçamento por Grupos</h3>
              <p className="text-gray-400">
                Divida sua renda em percentuais: Essenciais, Estilo de Vida, Investimentos.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Metas (Little Boxes)</h3>
              <p className="text-gray-400">
                Crie metas de economia e acompanhe seu progresso com aportes manuais.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Parcelas</h3>
              <p className="text-gray-400">
                Registre compras parceladas e visualize os compromissos futuros.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-32 text-center text-gray-500 text-sm">
          <p>© 2024 Spending Control. Controle financeiro simplificado.</p>
        </footer>
      </div>
    </div>
  );
}
