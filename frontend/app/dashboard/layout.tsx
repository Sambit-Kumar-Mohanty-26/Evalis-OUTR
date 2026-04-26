"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NeuralBackground } from "@/components/ui/NeuralBackground";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Calendar } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
            } else if (user.onboardingRequired && user.role !== "ADMIN") {
                router.push("/onboard/setup");
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F4F2EB] flex items-center justify-center">
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <div className="w-12 h-12 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
                </motion.div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F4F2EB] flex overflow-hidden selection:bg-[#FFB3D9]/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0">
                <NeuralBackground />
            </div>

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
                {/* Dashboard Navbar */}
                <header className="h-20 flex items-center justify-between px-12 bg-white/10 backdrop-blur-sm border-b border-[#1C1C1A]/5">
                    <div className="flex items-center gap-8">
                        {/* Search Bar */}
                        <div className="relative group w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 group-focus-within:text-brand-green transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search everything..."
                                className="w-full pl-12 pr-4 py-2.5 bg-white/40 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none focus:bg-white focus:shadow-lg transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Date Display */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/40 rounded-xl border border-[#1C1C1A]/5 text-xs font-sans font-bold text-[#1C1C1A]/60">
                            <Calendar size={14} className="text-brand-green" />
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>

                        {/* Notifications */}
                        <button className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-white/40 border border-[#1C1C1A]/5 text-[#1C1C1A]/40 hover:text-brand-green hover:bg-white hover:shadow-lg transition-all group">
                            <Bell size={20} strokeWidth={1.5} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-green border-2 border-[#F4F2EB]" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
