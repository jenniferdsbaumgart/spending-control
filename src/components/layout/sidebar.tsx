"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Receipt,
    PieChart,
    Target,
    CreditCard,
    Settings,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/server/actions/auth";
import { useRouter } from "next/navigation";
import { getCurrentMonthKey } from "@/lib/date";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

export function Sidebar() {
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const workspaceId = params.workspaceId as string;
    const currentMonth = getCurrentMonthKey();

    const navItems: NavItem[] = [
        {
            label: "Dashboard",
            href: `/app/${workspaceId}/month/${currentMonth}`,
            icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
            label: "Transações",
            href: `/app/${workspaceId}/transactions`,
            icon: <Receipt className="h-5 w-5" />,
        },
        {
            label: "Orçamentos",
            href: `/app/${workspaceId}/budgets`,
            icon: <PieChart className="h-5 w-5" />,
        },
        {
            label: "Metas",
            href: `/app/${workspaceId}/goals`,
            icon: <Target className="h-5 w-5" />,
        },
        {
            label: "Parcelas",
            href: `/app/${workspaceId}/installments`,
            icon: <CreditCard className="h-5 w-5" />,
        },
        {
            label: "Configurações",
            href: `/app/${workspaceId}/settings`,
            icon: <Settings className="h-5 w-5" />,
        },
    ];

    async function handleLogout() {
        await logoutUser();
        router.push("/login");
        router.refresh();
    }

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <Link href={`/app/${workspaceId}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">$</span>
                    </div>
                    <span className="text-white font-semibold text-lg">Spending Control</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                </Button>
            </div>
        </aside>
    );
}
