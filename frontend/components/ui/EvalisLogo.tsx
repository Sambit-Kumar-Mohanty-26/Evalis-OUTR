"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EvalisLogoProps {
    className?: string;
}

export function EvalisLogo({ className }: EvalisLogoProps) {
    return (
        <Link href="/" className={cn("group relative inline-flex flex-col items-start gap-0.5", className)}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-baseline relative"
            >
                <span className="font-sans font-black text-4xl md:text-5xl tracking-tighter text-[#1C1C1A] selection:bg-[#FFB3D9]">
                    evalis
                </span>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                    className="w-3 h-3 md:w-4 md:h-4 bg-[#FFB3D9] rounded-full ml-1 mb-1 shadow-[0_0_15px_rgba(255,179,217,0.4)]"
                />

                <motion.svg
                    className="absolute -bottom-2 left-0 w-[110%] h-[12px] overflow-visible pointer-events-none"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                >
                    <motion.path
                        d="M 2 8 Q 50 4 98 8"
                        fill="transparent"
                        stroke="#FFB3D9"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.7 }}
                        transition={{ delay: 1.2, duration: 1, ease: "easeInOut" }}
                    />
                    <motion.path
                        d="M 5 7 Q 45 3 95 7"
                        fill="transparent"
                        stroke="#FFB3D9"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.8, ease: "easeInOut" }}
                    />
                </motion.svg>
            </motion.div>
        </Link>
    );
}