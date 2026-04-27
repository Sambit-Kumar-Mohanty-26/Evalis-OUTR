"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface ChartCardProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    children: ReactNode;
    className?: string;
    delay?: number;
    action?: ReactNode;
}

export function ChartCard({ title, subtitle, icon: Icon, children, className, delay = 0, action }: ChartCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "group relative bg-white/50 backdrop-blur-xl border border-[#1C1C1A]/5 rounded-[2rem] p-8 transition-all duration-500 hover:shadow-xl hover:shadow-[#1C1C1A]/5",
                className
            )}
        >
            {/* Ambient glow */}
            <div className="absolute -inset-px bg-gradient-to-br from-brand-green/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green transition-all group-hover:shadow-lg group-hover:shadow-brand-green/10">
                                <Icon size={20} strokeWidth={1.5} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-base font-bold text-[#1C1C1A]">{title}</h3>
                            {subtitle && (
                                <p className="text-xs text-[#1C1C1A]/40 mt-0.5">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
                {children}
            </div>
        </motion.div>
    );
}
