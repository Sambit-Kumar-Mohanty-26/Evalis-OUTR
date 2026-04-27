"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, TrendingDown } from "lucide-react";

interface Performer {
    rank?: number;
    name: string;
    roll: string;
    branch?: string;
    cgpa?: number;
    total?: number;
    status?: string;
}

interface PerformersTableProps {
    data: Performer[];
    type: "top" | "bottom";
    valueLabel?: string;
    valueKey?: "cgpa" | "total";
}

function getRankIcon(rank: number) {
    if (rank === 1) return <span className="text-lg">🥇</span>;
    if (rank === 2) return <span className="text-lg">🥈</span>;
    if (rank === 3) return <span className="text-lg">🥉</span>;
    return <span className="text-xs font-bold text-[#1C1C1A]/30">#{rank}</span>;
}

export function PerformersTable({
    data,
    type,
    valueLabel = "CGPA",
    valueKey = "cgpa",
}: PerformersTableProps) {
    return (
        <div className="space-y-2">
            {data.map((item, i) => (
                <motion.div
                    key={item.roll}
                    initial={{ opacity: 0, x: type === "top" ? -16 : 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                        type === "top"
                            ? "bg-white/60 border-[#1C1C1A]/5 hover:border-brand-green/20"
                            : "bg-red-50/50 border-red-100 hover:border-red-200"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-[#1C1C1A]/5">
                            {item.rank ? getRankIcon(item.rank) : (
                                type === "top"
                                    ? <Trophy size={16} className="text-brand-green" />
                                    : <TrendingDown size={16} className="text-red-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#1C1C1A]">{item.name}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-[#1C1C1A]/40">{item.roll}</span>
                                {item.branch && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-[#F4F2EB] rounded text-[#1C1C1A]/40 font-bold">{item.branch}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-lg font-serif font-bold ${
                            type === "top" ? "text-brand-green" : "text-red-500"
                        }`}>
                            {item[valueKey] ?? "—"}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[#1C1C1A]/30">
                            {item.status || valueLabel}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
