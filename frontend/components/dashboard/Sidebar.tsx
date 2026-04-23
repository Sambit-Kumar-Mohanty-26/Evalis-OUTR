"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
    LayoutDashboard, 
    Network, 
    GraduationCap, 
    Users, 
    CalendarDays, 
    ClipboardList, 
    BarChart3, 
    Settings, 
    LogOut,
    ShieldAlert
} from "lucide-react";
import { EvalisLogo } from "@/components/ui/EvalisLogo";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Organization", icon: Network, href: "/dashboard/organization" },
    { name: "Academics", icon: GraduationCap, href: "/dashboard/academics" },
    { name: "Users", icon: Users, href: "/dashboard/users" },
    { name: "Batches", icon: CalendarDays, href: "/dashboard/batches" },
    { name: "Exams", icon: ClipboardList, href: "/dashboard/exams" },
    { name: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { name: "Audit Logs", icon: ShieldAlert, href: "/dashboard/audit" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="w-72 h-screen flex flex-col bg-white/20 backdrop-blur-xl border-r border-[#1C1C1A]/5 relative z-20">
            {/* Logo Section */}
            <div className="p-8 mb-4">
                <EvalisLogo className="scale-90 origin-left" />
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className={cn(
                                    "px-4 py-3.5 rounded-2xl flex items-center gap-4 transition-all duration-300 group",
                                    isActive 
                                        ? "bg-[#1C1C1A] text-white shadow-lg shadow-[#1C1C1A]/10" 
                                        : "text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white/40"
                                )}
                            >
                                <item.icon 
                                    size={20} 
                                    strokeWidth={isActive ? 2 : 1.5} 
                                    className={cn(
                                        "transition-transform group-hover:scale-110",
                                        isActive ? "text-brand-green" : "text-current"
                                    )} 
                                />
                                <span className="font-sans text-sm font-medium tracking-wide">
                                    {item.name}
                                </span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="sidebar-active"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Settings */}
            <div className="p-4 border-t border-[#1C1C1A]/5">
                <Link href="/dashboard/settings">
                    <div className="px-4 py-3 rounded-2xl flex items-center gap-3 text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white/40 transition-all mb-2 cursor-pointer group">
                        <Settings size={20} strokeWidth={1.5} className="group-hover:rotate-45 transition-transform duration-500" />
                        <span className="text-sm font-medium">Settings</span>
                    </div>
                </Link>
                <div className="p-4 rounded-[24px] bg-white/40 border border-[#1C1C1A]/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-serif font-bold text-lg border border-brand-green/10">
                            {user?.fullName?.charAt(0) || "A"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1C1C1A] truncate max-w-[120px]">
                                {user?.fullName || "Administrator"}
                            </span>
                            <span className="text-[10px] text-[#1C1C1A]/40 uppercase tracking-widest font-sans font-bold">
                                {user?.role || "ADMIN"}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={14} />
                        Terminate Session
                    </button>
                </div>
            </div>
        </aside>
    );
}
