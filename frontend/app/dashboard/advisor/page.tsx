"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, GraduationCap, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
    return (
        <div className="bg-white rounded-2xl p-4 border border-[#1C1C1A]/5 shadow-sm">
            <div className={`text-2xl font-serif font-bold ${color}`}>{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30 mt-0.5">{label}</div>
        </div>
    );
}

export default function AdvisorOverview() {
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/advisor/overview')
            .then(d => setOverview(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><GraduationCap size={14} /> Branch Advisor</div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">{overview?.branchName || 'Advisor Dashboard'}</h1>
                <p className="text-[#1C1C1A]/40 mt-1">{overview?.schoolName || 'Manage and monitor your branch students'}</p>
            </div>

            {overview && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBadge value={String(overview.totalStudents)} label="Total Students" color="text-blue-500" />
                        <StatBadge value={`${overview.avgCGPA}`} label="Avg CGPA" color="text-brand-green" />
                        <StatBadge value={`${overview.passPercent}%`} label="Pass Rate" color="text-emerald-500" />
                        <StatBadge value={`${overview.backlogPercent}%`} label="Backlog Rate" color="text-red-500" />
                    </div>
                    {overview.semesterDistribution && (
                        <div className="bg-white rounded-3xl p-6 border border-[#1C1C1A]/5 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/40 mb-4">Semester Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(overview.semesterDistribution).map(([sem, count]: any) => (
                                    <div key={sem} className="text-center bg-[#F4F2EB] rounded-2xl p-4">
                                        <div className="text-xl font-serif font-bold text-[#1C1C1A]">{count}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-0.5">Sem {sem}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
