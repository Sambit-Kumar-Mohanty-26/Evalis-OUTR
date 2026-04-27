"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface HeatmapItem {
    semester: string;
    subject: string;
    failRate: number;
}

interface HeatmapChartProps {
    data: HeatmapItem[];
    height?: number;
}

function getIntensityColor(value: number): string {
    if (value >= 40) return "bg-red-500";
    if (value >= 30) return "bg-red-400";
    if (value >= 20) return "bg-amber-400";
    if (value >= 15) return "bg-amber-300";
    if (value >= 10) return "bg-yellow-300";
    return "bg-green-300";
}

function getTextColor(value: number): string {
    if (value >= 30) return "text-white";
    return "text-[#1C1C1A]";
}

export function HeatmapChart({ data }: HeatmapChartProps) {
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    const semesters = [...new Set(data.map(d => d.semester))];
    const subjects = [...new Set(data.map(d => d.subject))];

    const getFailRate = (sem: string, sub: string) => {
        const item = data.find(d => d.semester === sem && d.subject === sub);
        return item?.failRate ?? null;
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                {/* Header row */}
                <div className="flex gap-1 mb-1">
                    <div className="w-28 shrink-0" />
                    {subjects.map((sub) => (
                        <div key={sub} className="flex-1 text-center text-[10px] font-bold text-[#1C1C1A]/40 uppercase tracking-wide px-1 truncate" title={sub}>
                            {sub.length > 12 ? sub.substring(0, 12) + '…' : sub}
                        </div>
                    ))}
                </div>

                {/* Data rows */}
                {semesters.map((sem, semIdx) => (
                    <div key={sem} className="flex gap-1 mb-1">
                        <div className="w-28 shrink-0 flex items-center text-xs font-bold text-[#1C1C1A]/50 pr-2">
                            {sem}
                        </div>
                        {subjects.map((sub, subIdx) => {
                            const value = getFailRate(sem, sub);
                            const cellKey = `${sem}-${sub}`;
                            if (value === null) {
                                return (
                                    <div key={cellKey} className="flex-1 h-12 rounded-lg bg-[#1C1C1A]/3" />
                                );
                            }
                            return (
                                <motion.div
                                    key={cellKey}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: semIdx * 0.05 + subIdx * 0.03, duration: 0.4 }}
                                    onMouseEnter={() => setHoveredCell(cellKey)}
                                    onMouseLeave={() => setHoveredCell(null)}
                                    className={`flex-1 h-12 rounded-lg flex items-center justify-center relative cursor-pointer transition-all duration-200 ${getIntensityColor(value)} ${
                                        hoveredCell === cellKey ? 'ring-2 ring-[#1C1C1A]/20 scale-105 z-10' : ''
                                    }`}
                                >
                                    <span className={`text-xs font-bold ${getTextColor(value)}`}>
                                        {value}%
                                    </span>

                                    {/* Tooltip */}
                                    {hoveredCell === cellKey && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-[#1C1C1A]/10 rounded-xl px-3 py-2 shadow-xl z-20 whitespace-nowrap"
                                        >
                                            <p className="text-[10px] font-bold text-[#1C1C1A]/40">{sub}</p>
                                            <p className="text-xs font-bold text-[#1C1C1A]">{value}% failure rate</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ))}

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#1C1C1A]/5">
                    <span className="text-[10px] text-[#1C1C1A]/40 font-bold">LOW</span>
                    {[
                        { color: "bg-green-300", label: "<10%" },
                        { color: "bg-yellow-300", label: "10-15%" },
                        { color: "bg-amber-300", label: "15-20%" },
                        { color: "bg-amber-400", label: "20-30%" },
                        { color: "bg-red-400", label: "30-40%" },
                        { color: "bg-red-500", label: ">40%" },
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-1">
                            <div className={`w-4 h-3 rounded ${l.color}`} />
                            <span className="text-[9px] text-[#1C1C1A]/30 font-medium">{l.label}</span>
                        </div>
                    ))}
                    <span className="text-[10px] text-[#1C1C1A]/40 font-bold">HIGH</span>
                </div>
            </div>
        </div>
    );
}
