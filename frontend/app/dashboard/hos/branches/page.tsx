"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function HOSBranches() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/hos/branches')
            .then(d => setBranches(d.branches || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Branch Performance</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Comparative analysis of academic results across branches</p>
            </div>

            <div className="space-y-4">
                {branches.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <Building2 size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/60">No branch data available yet.</p>
                    </div>
                ) : (
                    branches.map((branch, i) => (
                        <Link key={branch.branchId} href={`/dashboard/hos/branches/${branch.branchId}`}>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                transition={{ delay: i * 0.05 }} 
                                className="bg-white rounded-[32px] p-8 border border-[#1C1C1A]/5 shadow-sm hover:shadow-xl hover:border-brand-green/20 transition-all group cursor-pointer mb-4"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-green/5 flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-serif font-bold text-[#1C1C1A]">{branch.branchName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">{branch.totalStudents} enrolled students</p>
                                                <div className="w-1 h-1 rounded-full bg-[#1C1C1A]/10" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">{branch.batches || 'No Active Batches'}</p>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <span className="text-4xl font-serif font-bold text-emerald-500">{branch.passPercent}%</span>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/40 mt-1">Pass Rate</p>
                                        </div>
                                        <ChevronRight className="text-[#1C1C1A]/10 group-hover:text-brand-green transition-colors" />
                                    </div>
                                </div>
                                <div className="h-2 bg-[#F4F2EB] rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${branch.passPercent}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]" 
                                    />
                                </div>
                            </motion.div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}

