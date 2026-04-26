"use client";

import { useState, useEffect } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AdvisorSubjects() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/advisor/subjects')
            .then(d => setSubjects(d.subjects || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Subject Performance</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Analyze pass/fail rates across all branch subjects</p>
            </div>

            <div className="space-y-4">
                {subjects.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <BarChart3 size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/60">No published results available yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead><tr className="bg-[#F4F2EB]">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Pass Rate</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Fail Rate</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Visualizer</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[#1C1C1A]/5">
                                {subjects.map(s => (
                                    <tr key={s.subjectId} className="hover:bg-[#F4F2EB]/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#1C1C1A]">{s.name}</p>
                                            <p className="text-[10px] font-mono text-[#1C1C1A]/40 uppercase tracking-tighter">{s.code}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-black text-emerald-500">{s.passPercent}%</td>
                                        <td className="px-6 py-4 text-center text-sm font-black text-red-500">{s.failPercent}%</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="w-24 h-1.5 bg-red-100 rounded-full overflow-hidden ml-auto">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${s.passPercent}%` }}
                                                />
                                            </div>
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
