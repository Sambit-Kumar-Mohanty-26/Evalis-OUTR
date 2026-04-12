"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PrismContainerProps {
    children: React.ReactNode;
    step: number;
    className?: string;
    disable3D?: boolean;
}

export function PrismContainer({ children, step, className, disable3D = false }: PrismContainerProps) {
    return (
        <div className="relative" style={{ perspective: disable3D ? "none" : "2000px" }}>
            <motion.div
                key={step}
                initial={disable3D ? { opacity: 0, scale: 0.95 } : { rotateY: 45, opacity: 0, scale: 0.9, translateZ: -100 }}
                animate={disable3D ? { opacity: 1, scale: 1 } : { rotateY: 0, opacity: 1, scale: 1, translateZ: 0 }}
                exit={disable3D ? { opacity: 0, scale: 0.95 } : { rotateY: -45, opacity: 0, scale: 0.9, translateZ: -100 }}
                transition={{
                    duration: 1,
                    ease: [0.16, 1, 0.3, 1]
                }}
                style={{ transformStyle: disable3D ? "flat" : "preserve-3d" }}
                className={cn(
                    "relative w-full bg-white/60 backdrop-blur-[40px] border border-white/40 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] rounded-[48px] overflow-x-clip overflow-y-visible p-8 md:p-12",
                    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:pointer-events-none",
                    className
                )}
            >
                <div className="absolute inset-0 pointer-events-none border border-[#FFB3D9]/20 rounded-[48px] z-0 blur-[1px]" />
                <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                />

                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
