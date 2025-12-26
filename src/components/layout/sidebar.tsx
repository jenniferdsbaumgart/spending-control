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
        <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-sidebar-border">
                <Link href={`/app/${workspaceId}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">$</span>
                    </div>
                    <span className="text-sidebar-foreground font-semibold text-lg">Spending Control</span>
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
                                    ? "bg-sidebar-accent text-sidebar-primary"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                </Button>
            </div>
        </aside>
    );
}
