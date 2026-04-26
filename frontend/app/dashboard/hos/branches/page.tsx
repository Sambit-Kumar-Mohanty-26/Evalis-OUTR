"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

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
                        <motion.div 
                            key={branch.branchId} 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: i * 0.05 }} 
                            className="bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-[#1C1C1A]">{branch.branchName}</h3>
                                    <p className="text-xs font-black uppercase tracking-widest text-[#1C1C1A]/30">{branch.totalStudents} enrolled students</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-serif font-bold text-emerald-500">{branch.passPercent}%</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Pass Rate</p>
                                </div>
                            </div>
                            <div className="h-3 bg-[#F4F2EB] rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${branch.passPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.2)]" 
                                />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
