"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    error?: string;
    compact?: boolean;
}

export function CustomSelect({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select option", 
    label,
    className,
    error,
    compact = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: "bottom" });

    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                const portals = document.querySelectorAll('.custom-select-portal');
                let clickedInPortal = false;
                portals.forEach(p => { if (p.contains(event.target as Node)) clickedInPortal = true; });
                if (!clickedInPortal) setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 220; // Approx max height of menu
            
            let top = rect.bottom + window.scrollY;
            let placement = "bottom";

            if (spaceBelow < dropdownHeight && rect.top > spaceBelow) {
                top = rect.top + window.scrollY;
                placement = "top";
            }

            setCoords({
                top,
                left: rect.left + window.scrollX,
                width: rect.width,
                placement
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    return (
        <div className={cn("relative w-full font-sans group", className)} ref={containerRef}>
            {label && (
                <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-[0.1em] mb-1.5 px-1">
                    {label}
                </p>
            )}
            
            {/* Trigger */}
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between bg-white/[0.03] border border-[#1C1C1A]/[0.05] rounded-2xl transition-all duration-300",
                    compact ? "px-4 py-2.5" : "px-5 py-3.5",
                    isOpen ? "bg-white/10 ring-2 ring-brand-green/20 border-brand-green/30" : "hover:bg-white/5 hover:border-[#1C1C1A]/10",
                    error && "border-red-500/50 bg-red-500/[0.02]"
                )}
            >
                <span className={cn(
                    "text-sm font-semibold truncate", 
                    !selectedOption ? "text-[#1C1C1A]/30" : "text-[#1C1C1A]/80"
                )}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[#1C1C1A]/20"
                >
                    <ChevronDown size={compact ? 16 : 18} />
                </motion.div>
            </motion.button>

            {/* Menu - Portal Rendered */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: coords.placement === "top" ? 8 : -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: coords.placement === "top" ? 8 : -8, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className={cn(
                                "custom-select-portal fixed z-[9999] bg-white border border-[#1C1C1A]/10 shadow-2xl overflow-hidden",
                                coords.placement === "top" 
                                    ? "rounded-t-2xl rounded-b-md origin-bottom transform translate-y-[calc(-100%-8px)]" 
                                    : "rounded-t-md rounded-b-2xl origin-top mt-1"
                            )}
                            style={{
                                top: coords.top,
                                left: coords.left,
                                width: coords.width
                            }}
                        >
                            <div className="py-2 max-h-52 overflow-y-auto custom-scrollbar">
                                {options.length === 0 ? (
                                    <div className="px-5 py-4 text-xs text-[#1C1C1A]/30 italic text-center">
                                        No options available
                                    </div>
                                ) : (
                                    options.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-5 py-2.5 text-left transition-all font-medium",
                                                value === option.value 
                                                    ? "text-brand-green bg-brand-green/5" 
                                                    : "text-[#1C1C1A]/60 hover:bg-[#1C1C1A]/[0.02] hover:text-[#1C1C1A]"
                                            )}
                                        >
                                            <span className="text-sm">{option.label}</span>
                                            {value === option.value && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <Check size={14} strokeWidth={3} className="text-brand-green" />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {error && (
                <p className="mt-1 px-1 text-[10px] font-semibold text-red-500/80 uppercase tracking-wider">
                    {error}
                </p>
            )}
        </div>
    );
}
