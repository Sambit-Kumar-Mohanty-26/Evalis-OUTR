"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Loader2, Clock, Award } from "lucide-react";
import { api } from "@/lib/api";

export default function StudentHistory() {
    const [history, setHistory] = useState<{ semesters: any[]; promotions: any[] }>({ semesters: [], promotions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/student/history')
            .then(d => setHistory(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Academic History</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Timeline of your semester-over-semester performance and promotions</p>
            </div>

            <div className="space-y-6">
                {history.semesters.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <Clock size={40} className="text-[#1C1C1A]/10 mx-auto mb-3" />
                        <p className="font-serif text-[#1C1C1A]/40">No historical records available yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {history.semesters.map((s, i) => (
                            <motion.div 
                                key={s.id} 
                                initial={{ opacity: 0, x: -20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                transition={{ delay: i * 0.05 }} 
                                className="bg-white rounded-[2rem] p-8 border border-[#1C1C1A]/5 flex items-center justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-green" />
                                <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-3xl bg-[#F4F2EB] flex items-center justify-center border border-[#1C1C1A]/5">
                                        <Award size={32} className="text-brand-green" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Academic Phase</p>
                                        <p className="text-2xl font-serif font-bold text-[#1C1C1A] mt-0.5">Semester {s.semesterNumber}</p>
                                        <div className="flex gap-4 mt-2">
                                            <span className="text-xs font-black text-brand-green bg-brand-green/5 px-2 py-1 rounded-lg uppercase">SGPA: {s.sgpa}</span>
                                            <span className="text-xs font-black text-[#1C1C1A]/40 bg-[#F4F2EB] px-2 py-1 rounded-lg uppercase">CGPA: {s.cgpa}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Status</p>
                                    <p className="text-sm font-bold text-emerald-500 mt-0.5">COMPLETED</p>
                                    <p className="text-[10px] text-[#1C1C1A]/30 mt-1 uppercase font-black">Official Entry</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
