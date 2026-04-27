"use client";

import { useState, useEffect } from "react";
import { Flame, Loader2, Info } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { api } from "@/lib/api";

export default function HOSHeatmap() {
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/hos/backlog-heatmap')
            .then(d => setHeatmap(d.heatmap || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    // Group by semester for the grid
    const maxSem = Math.max(...heatmap.map(h => h.semester), 8);
    const subjects = Array.from(new Set(heatmap.map(h => h.subjectName)));

    const getIntensityColor = (count: number) => {
        if (count === 0) return "bg-[#F4F2EB]/50 border-transparent text-[#1C1C1A]/20";
        if (count < 5) return "bg-orange-100/80 border-orange-200 text-orange-700 shadow-[inset_0_0_20px_rgba(255,237,213,0.5)]";
        if (count < 10) return "bg-orange-500 text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)] border-orange-400";
        return "bg-red-600 text-white shadow-[0_4px_20px_rgba(220,38,38,0.4)] border-red-500";
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.02 } }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.8 },
        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Backlog Heatmap</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Cinematic view of backlog accumulation across semesters and subjects.</p>
            </div>

            {heatmap.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                    <Flame size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                    <p className="text-lg font-serif text-[#1C1C1A]/60">No active backlogs found in the system.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] p-8 border border-[#1C1C1A]/5 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex items-center gap-6 mb-8 text-xs font-bold uppercase tracking-widest text-[#1C1C1A]/40">
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#F4F2EB]/50 border border-[#1C1C1A]/5" /> 0</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-orange-100 border border-orange-200" /> 1-4</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-orange-500 shadow-md" /> 5-9</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-red-600 shadow-md" /> 10+</div>
                        <div className="ml-auto flex items-center gap-2 text-brand-green">
                            <Info size={14} /> Hover for details
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-4">
                        <div className="min-w-[800px]">
                            {/* Header row (Semesters) */}
                            <div className="flex mb-4 ml-48">
                                {Array.from({ length: maxSem }).map((_, i) => (
                                    <div key={`sem-${i}`} className="flex-1 text-center text-xs font-black text-[#1C1C1A]/40 uppercase tracking-widest">
                                        Sem {i + 1}
                                    </div>
                                ))}
                            </div>

                            {/* Grid */}
                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                                {subjects.map((sub, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-44 text-right">
                                            <p className="text-sm font-bold text-[#1C1C1A] truncate" title={sub}>{sub}</p>
                                        </div>
                                        <div className="flex flex-1 gap-2">
                                            {Array.from({ length: maxSem }).map((_, semIdx) => {
                                                const record = heatmap.find(h => h.subjectName === sub && h.semester === semIdx + 1);
                                                const count = record ? record.count : 0;
                                                return (
                                                    <motion.div 
                                                        key={`cell-${i}-${semIdx}`}
                                                        variants={itemVariants}
                                                        whileHover={{ scale: 1.1, zIndex: 10 }}
                                                        className={`flex-1 aspect-square rounded-xl flex items-center justify-center font-serif text-lg border transition-all cursor-crosshair relative group ${getIntensityColor(count)}`}
                                                    >
                                                        {count > 0 && count}
                                                        
                                                        {/* Tooltip */}
                                                        {count > 0 && (
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-[#1C1C1A] text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none shadow-2xl transition-opacity z-50">
                                                                <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">{record.code}</p>
                                                                <p className="text-sm font-bold">{sub}</p>
                                                                <p className="text-xs text-brand-green mt-1">{count} student{count > 1 ? 's' : ''} with backlog</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
