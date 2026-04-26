"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Loader2, TrendingUp, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";

export default function StudentOverview() {
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/student/overview')
            .then(d => setOverview(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> Student Portal</div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">My Academic Profile</h1>
                <p className="text-[#1C1C1A]/40 mt-1 font-sans text-sm font-medium tracking-wide">
                    {overview?.rollNumber} · {overview?.school} · {overview?.branch}
                </p>
            </div>

            {overview && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-br from-[#1C1C1A] to-[#2C2C2A] rounded-[2rem] p-8 overflow-hidden shadow-xl shadow-[#1C1C1A]/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-5xl font-serif font-bold text-white">{overview.cgpa}</div>
                            <div className="text-xs font-black text-white/40 uppercase tracking-widest mt-1">Cumulative CGPA</div>
                        </div>
                        <div>
                            <div className="text-5xl font-serif font-bold text-brand-green">{overview.sgpa || 'N/A'}</div>
                            <div className="text-xs font-black text-white/40 uppercase tracking-widest mt-1">Last SGPA</div>
                        </div>
                        <div>
                            <div className="text-5xl font-serif font-bold text-white">{overview.currentSemester}</div>
                            <div className="text-xs font-black text-white/40 uppercase tracking-widest mt-1">Current Semester</div>
                        </div>
                        <div>
                            <div className={`text-5xl font-serif font-bold ${overview.activeBacklogs > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{overview.activeBacklogs}</div>
                            <div className="text-xs font-black text-white/40 uppercase tracking-widest mt-1">Active Backlogs</div>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-2">School Affiliation</p>
                        <p className="text-base font-bold text-[#1C1C1A]">{overview?.school}</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-2">Branch / Major</p>
                        <p className="text-base font-bold text-[#1C1C1A]">{overview?.branch}</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-2">Registration & ID</p>
                        <p className="text-base font-bold text-[#1C1C1A]">{overview?.rollNumber}</p>
                    </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mb-4">Latest Promotion Activity</p>
                    {overview?.lastPromotion ? (
                        <div className="flex items-center gap-4 bg-[#F4F2EB] rounded-2xl px-5 py-4 border border-[#1C1C1A]/5">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <TrendingUp size={18} className="text-brand-green" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#1C1C1A]">
                                    Promoted from Semester {overview.lastPromotion.fromSemester} → {overview.lastPromotion.toSemester}
                                </p>
                                <p className="text-[10px] text-[#1C1C1A]/40 uppercase font-black mt-0.5">Approved on {new Date(overview.lastPromotion.promotedAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#F4F2EB]/50 rounded-2xl px-5 py-4 text-center border border-dashed border-[#1C1C1A]/10">
                            <p className="text-xs font-bold text-[#1C1C1A]/30">No official promotion records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
