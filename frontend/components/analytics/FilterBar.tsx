"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FilterOption {
    value: string;
    label: string;
}

interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
}

interface FilterBarProps {
    filters: FilterConfig[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30 mr-2">
                Filters
            </span>
            {filters.map((filter) => {
                const isOpen = openDropdown === filter.key;
                const selected = filter.options.find(o => o.value === values[filter.key]);

                return (
                    <div key={filter.key} className="relative">
                        <button
                            onClick={() => setOpenDropdown(isOpen ? null : filter.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                                values[filter.key] && values[filter.key] !== "all"
                                    ? "bg-brand-green/10 border-brand-green/20 text-brand-green"
                                    : "bg-white/60 border-[#1C1C1A]/5 text-[#1C1C1A]/50 hover:border-[#1C1C1A]/10 hover:text-[#1C1C1A]/70"
                            }`}
                        >
                            {filter.label}: {selected?.label || "All"}
                            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full mt-2 left-0 z-40 min-w-[180px] bg-white/95 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-2xl shadow-xl overflow-hidden"
                                    >
                                        <button
                                            onClick={() => { onChange(filter.key, "all"); setOpenDropdown(null); }}
                                            className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors ${
                                                (!values[filter.key] || values[filter.key] === "all")
                                                    ? "bg-brand-green/10 text-brand-green font-bold"
                                                    : "text-[#1C1C1A]/60 hover:bg-[#F4F2EB]"
                                            }`}
                                        >
                                            All
                                        </button>
                                        {filter.options.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => { onChange(filter.key, option.value); setOpenDropdown(null); }}
                                                className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors ${
                                                    values[filter.key] === option.value
                                                        ? "bg-brand-green/10 text-brand-green font-bold"
                                                        : "text-[#1C1C1A]/60 hover:bg-[#F4F2EB]"
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
