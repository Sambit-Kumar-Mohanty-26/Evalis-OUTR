"use client";

import { motion, HTMLMotionProps, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import React, { useRef } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: "primary" | "outline";
    showArrow?: boolean;
    children?: React.ReactNode;
}

export function Button({ children, variant = "primary", showArrow = false, className, ...props }: ButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const shineX = useMotionValue(0);
    const shineY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        shineX.set(x);
        shineY.set(y);
    };

    return (
        <motion.button
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            whileHover={{
                scale: 1.02,
                y: -2,
                transition: { type: "spring", stiffness: 400, damping: 10 }
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "px-8 py-4 rounded-2xl font-sans font-bold text-sm uppercase tracking-widest transition-colors cursor-pointer inline-flex items-center justify-center gap-3 relative overflow-hidden group",
                variant === "primary"
                    ? "bg-[#3D8528] text-white shadow-[0_20px_40px_-15px_rgba(61,133,40,0.3)]"
                    : "bg-white/40 backdrop-blur-md border border-[#1C1C1A]/10 text-[#1C1C1A] hover:bg-white",
                className
            )}
            {...props}
        >
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: useTransform(
                        [shineX, shineY],
                        ([x, y]) => `radial-gradient(circle 120px at ${x}px ${y}px, rgba(255,255,255,0.25), transparent)`
                    ),
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <span className="relative z-10 flex items-center gap-2">
                {children}
                {showArrow && (
                    <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <ArrowRight size={18} strokeWidth={2.5} />
                    </motion.div>
                )}
            </span>
        </motion.button>
    );
}