"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function Dropdown({ options, value, onChange, placeholder = "Select option", className }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative w-full font-sans", className)} ref={containerRef}>
            {/* Trigger */}
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className={cn(
                    "w-full flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-md border border-[#1C1C1A]/5 rounded-2xl transition-all duration-300",
                    isOpen ? "ring-2 ring-brand-green/20 border-brand-green/20 shadow-lg" : "hover:border-[#1C1C1A]/10"
                )}
            >
                <span className={cn("text-base", !value && "text-[#1C1C1A]/30")}>
                    {value || placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[#1C1C1A]/30"
                >
                    <ChevronDown size={20} />
                </motion.div>
            </motion.button>

            {/* Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 6, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-50 w-full bg-white/80 backdrop-blur-2xl border border-[#1C1C1A]/5 rounded-2xl shadow-2xl overflow-hidden origin-top"
                    >
                        <div className="py-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <motion.button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option);
                                        setIsOpen(false);
                                    }}
                                    whileHover={{ backgroundColor: "rgba(61, 133, 40, 0.05)" }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-3 text-left transition-colors font-sans",
                                        value === option ? "text-brand-green font-bold bg-brand-green/5" : "text-[#1C1C1A]/60"
                                    )}
                                >
                                    <span className="text-sm">{option}</span>
                                    {value === option && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                            <Check size={16} strokeWidth={3} />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
