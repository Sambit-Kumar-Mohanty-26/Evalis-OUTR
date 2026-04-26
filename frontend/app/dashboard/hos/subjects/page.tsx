"use client";

import { useState, useEffect } from "react";
import { BookOpen, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export default function HOSSubjects() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/hos/subjects')
            .then(d => setSubjects(d.subjects || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Subject Analysis</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Identify academic risks and challenging subjects across the school</p>
            </div>

            <div className="space-y-4">
                {subjects.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <BookOpen size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/60">No subject analysis available yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead><tr className="bg-[#F4F2EB]">
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject Details</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Pass Rate</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Fail Rate</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Risk Status</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[#1C1C1A]/5">
                                {subjects.map(s => (
                                    <tr key={s.subjectId} className="hover:bg-[#F4F2EB]/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-[#1C1C1A]">{s.name}</p>
                                            <p className="text-[10px] font-mono text-[#1C1C1A]/40 uppercase tracking-tighter">{s.code}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center text-sm font-black text-emerald-500">{s.passPercent}%</td>
                                        <td className="px-6 py-5 text-center text-sm font-black text-red-500">{s.failPercent}%</td>
                                        <td className="px-6 py-5 text-right">
                                            {s.isHighRisk ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-wider border border-red-100/50">
                                                    <AlertTriangle size={12} /> High Risk
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-100/50">
                                                    Stable
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
