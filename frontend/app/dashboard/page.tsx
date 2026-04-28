"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { 
    Users, 
    GraduationCap, 
    BookOpen, 
    ClipboardCheck, 
    TrendingUp, 
    AlertCircle,
    Plus,
    UserPlus,
    FilePlus,
    Upload,
    Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

const ROLE_REDIRECT: Record<string, string> = {
    HEAD_OF_SCHOOL: '/dashboard/hos',
    ADVISOR: '/dashboard/advisor',
    TEACHER: '/dashboard/teacher',
    STUDENT: '/dashboard/student',
};

export default function DashboardOverview() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (user?.role && ROLE_REDIRECT[user.role]) {
            router.replace(ROLE_REDIRECT[user.role]);
        }
    }, [user?.role, router]);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            setLoadingStats(true);
            api.get("/api/v1/analytics/admin/overview")
                .then((data: any) => setStats(data))
                .catch((err: any) => console.error(err))
                .finally(() => setLoadingStats(false));
        } else {
            setLoadingStats(false);
        }
    }, [user]);

    // Show spinner while redirecting non-admin roles
    if (user?.role && ROLE_REDIRECT[user.role]) {
        return <div className="flex items-center justify-center h-full py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;
    }

    if (loadingStats) {
        return <div className="flex items-center justify-center h-full py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;
    }

    const splitText = (text: string) => {
        return text.split(" ").map((word, i) => (
            <span key={i} className="inline-block whitespace-nowrap overflow-hidden py-1">
                {word.split("").map((char, j) => (
                    <motion.span
                        key={`${i}-${j}`}
                        initial={{ y: "110%", rotateZ: 10 }}
                        animate={{ y: 0, rotateZ: 0 }}
                        transition={{
                            duration: 1,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.2 + (i * 0.1) + (j * 0.02)
                        }}
                        className="inline-block"
                    >
                        {char}
                    </motion.span>
                ))}
                {i < text.split(" ").length - 1 && "\u00A0"}
            </span>
        ));
    };

    if (user?.role !== "ADMIN") {
        return (
            <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center space-y-6">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-32 h-32 rounded-full bg-brand-green/5 flex items-center justify-center text-brand-green"
                >
                    <AlertCircle size={64} strokeWidth={1} />
                </motion.div>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-serif text-[#1C1C1A]">
                        {user?.role?.replace(/_/g, " ")} Dashboard
                    </h1>
                    <p className="text-[#1C1C1A]/40 text-lg font-light">
                        This module is currently under development. Coming Soon.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
                <div>
                    <h1 className="text-5xl font-serif text-[#1C1C1A] leading-[1.1] mb-4">
                        {splitText(`Welcome back, ${user?.fullName?.split(" ")[0] || "Admin"}`)}
                    </h1>
                    <p className="text-[#1C1C1A]/50 text-xl font-light max-w-lg">
                        System health is optimal. Institutional intelligence is synchronized across all nodes.
                    </p>
                </div>
                
                {/* Global Status */}
                <div className="flex items-center gap-4 px-6 py-4 bg-white/40 border border-[#1C1C1A]/5 rounded-[24px]">
                    <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                        <TrendingUp size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[#1C1C1A]/30">Global Rank</span>
                        <span className="text-xl font-serif font-bold text-[#1C1C1A]">A+ Tier</span>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Total Students" 
                    value={stats?.totalStudents?.toLocaleString() || "0"} 
                    icon={Users} 
                    description="Active student roster"
                    delay={0.1}
                />
                <KpiCard 
                    title="Faculty Members" 
                    value={stats?.totalFaculty?.toLocaleString() || "0"} 
                    icon={GraduationCap} 
                    description="Teaching staff"
                    delay={0.2}
                />
                <KpiCard 
                    title="Active Programs" 
                    value={stats?.totalPrograms?.toLocaleString() || "0"} 
                    icon={BookOpen} 
                    description="Degrees & Blueprints"
                    delay={0.3}
                />
                <KpiCard 
                    title="Avg CGPA" 
                    value={stats?.avgCgpa ? Number(stats.avgCgpa).toFixed(2) : "0.00"} 
                    icon={ClipboardCheck} 
                    description="Institutional aggregate"
                    delay={0.4}
                />
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Snapshot */}
                <div className="lg:col-span-2 p-10 bg-white/40 backdrop-blur-md rounded-[40px] border border-[#1C1C1A]/5">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-2xl font-serif text-[#1C1C1A]">Performance Snapshot</h2>
                        <button className="text-xs font-bold text-[#1C1C1A]/40 hover:text-brand-green transition-colors uppercase tracking-widest">Avg CGPA Trend</button>
                    </div>
                    
                    {/* Real Visualization */}
                    <div className="h-[300px] flex items-end gap-6 px-4 pb-6">
                        {stats?.cgpaTrend && stats.cgpaTrend.length > 0 ? (
                            stats.cgpaTrend.map((item: any, i: number) => {
                                const height = item.cgpa ? (item.cgpa / 10) * 100 : 0;
                                return (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                        className="flex-1 bg-gradient-to-t from-brand-green/40 to-brand-green/10 rounded-t-2xl relative group cursor-pointer"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1C1C1A] text-white text-[10px] py-1 px-2 rounded-md font-bold">
                                            {item.cgpa} GPA
                                        </div>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1C1C1A]/40 whitespace-nowrap uppercase tracking-widest">
                                            {item.semester}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full text-[#1C1C1A]/30 gap-2">
                                <AlertCircle size={24} strokeWidth={1.5} />
                                <span className="text-xs font-bold uppercase tracking-wider">No snapshot data recorded yet</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions & Alerts */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="p-8 bg-white/60 backdrop-blur-md rounded-[40px] border border-[#1C1C1A]/5 shadow-xl shadow-[#1C1C1A]/5">
                        <h2 className="text-xl font-serif text-[#1C1C1A] mb-8">Interventions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { text: "Add Student", icon: UserPlus, href: "/dashboard/users?tab=students&action=add" },
                                { text: "Add Teacher", icon: Plus, href: "/dashboard/users?tab=teachers&action=add" },
                                { text: "Create Exam", icon: FilePlus, href: "/dashboard/exams?tab=instances&action=new" },
                                { text: "Upload CSV", icon: Upload, href: "/dashboard/users?tab=students&action=upload" },
                            ].map((action) => (
                                <button 
                                    key={action.text}
                                    onClick={() => router.push(action.href)}
                                    className="p-4 rounded-3xl bg-white border border-[#1C1C1A]/5 flex flex-col items-center gap-3 hover:bg-[#1C1C1A] hover:text-white transition-all duration-500 group"
                                >
                                    <action.icon size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{action.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="p-8 bg-red-50/50 backdrop-blur-md rounded-[40px] border border-red-100">
                        <div className="flex items-center gap-3 mb-6 text-red-600">
                            <AlertCircle size={20} />
                            <h2 className="text-lg font-serif">Security Alerts</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                "8 Subjects without assigned teachers",
                                "Missing marks for Mid-Sem Exam",
                                "12 Students at risk of failure"
                            ].map((alert, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/50 border border-red-50 text-xs font-sans text-red-900/60 leading-relaxed">
                                    {alert}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer v-tag */}
            <div className="pt-8 text-center text-[10px] text-[#1C1C1A]/20 font-sans tracking-[0.3em] uppercase">
                Evalis Institutional Intelligence • Protocol v1.4.2
            </div>
        </div>
    );
}
