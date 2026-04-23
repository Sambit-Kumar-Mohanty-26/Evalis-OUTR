"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        isUp: boolean;
    };
    description?: string;
    className?: string;
    delay?: number;
}

export function KpiCard({ title, value, icon: Icon, trend, description, className, delay = 0 }: KpiCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "group relative p-8 bg-white/40 backdrop-blur-md rounded-[32px] border border-[#1C1C1A]/5 hover:bg-white/60 hover:shadow-2xl transition-all duration-700",
                className
            )}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#1C1C1A]/30">
                        {title}
                    </span>
                    <h3 className="text-4xl font-serif font-bold text-[#1C1C1A]">
                        {value}
                    </h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#1C1C1A]/5 flex items-center justify-center text-[#1C1C1A]/20 transition-all group-hover:bg-brand-green group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-green/20 group-hover:-translate-y-1">
                    <Icon size={28} strokeWidth={1.5} />
                </div>
            </div>

            <div className="flex items-center gap-3">
                {trend && (
                    <div className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
                        trend.isUp ? "bg-brand-green/10 text-brand-green" : "bg-red-50 text-red-500"
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", trend.isUp ? "bg-brand-green" : "bg-red-500")} />
                        {trend.value}
                    </div>
                )}
                {description && (
                    <span className="text-xs text-[#1C1C1A]/30 font-medium tracking-tight">
                        {description}
                    </span>
                )}
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-brand-green/20 to-transparent opacity-0 group-hover:opacity-100 rounded-[32px] transition-opacity duration-700 pointer-events-none" />
        </motion.div>
    );
}
