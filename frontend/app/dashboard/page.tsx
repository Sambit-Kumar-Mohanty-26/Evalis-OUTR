"use client";

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
    Upload
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export default function DashboardOverview() {
    const { user } = useAuth();

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
                    value="12,408" 
                    icon={Users} 
                    trend={{ value: "+4.2%", isUp: true }}
                    description="vs last semester"
                    delay={0.1}
                />
                <KpiCard 
                    title="Faculty Members" 
                    value="482" 
                    icon={GraduationCap} 
                    trend={{ value: "+12", isUp: true }}
                    description="Recently onboarded"
                    delay={0.2}
                />
                <KpiCard 
                    title="Active Programs" 
                    value="24" 
                    icon={BookOpen} 
                    description="B.Tech, MCA, MBA"
                    delay={0.3}
                />
                <KpiCard 
                    title="Avg CGPA" 
                    value="8.42" 
                    icon={ClipboardCheck} 
                    trend={{ value: "+0.12", isUp: true }}
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
                        <button className="text-xs font-bold text-[#1C1C1A]/40 hover:text-brand-green transition-colors uppercase tracking-widest">View Detailed Specs</button>
                    </div>
                    
                    {/* Simulated Visualization */}
                    <div className="h-[300px] flex items-end gap-3 px-4">
                        {[65, 80, 45, 90, 70, 85, 60, 95].map((height, i) => (
                            <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: 0.5 + (i * 0.1), duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="flex-1 bg-gradient-to-t from-brand-green/40 to-brand-green/10 rounded-t-2xl relative group cursor-pointer"
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1C1C1A] text-white text-[10px] py-1 px-2 rounded-md font-bold">
                                    {height}%
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions & Alerts */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div className="p-8 bg-white/60 backdrop-blur-md rounded-[40px] border border-[#1C1C1A]/5 shadow-xl shadow-[#1C1C1A]/5">
                        <h2 className="text-xl font-serif text-[#1C1C1A] mb-8">Interventions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { text: "Add Student", icon: UserPlus },
                                { text: "Add Teacher", icon: Plus },
                                { text: "Create Exam", icon: FilePlus },
                                { text: "Upload CSV", icon: Upload },
                            ].map((action) => (
                                <button 
                                    key={action.text}
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
