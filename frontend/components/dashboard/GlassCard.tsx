"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } : undefined}
            className={cn(
                "bg-white/40 backdrop-blur-xl border border-[#1C1C1A]/5 rounded-3xl p-6 transition-all duration-500",
                className
            )}
        >
            {children}
        </motion.div>
    );
}
