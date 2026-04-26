"use client";

import { useState, useEffect } from "react";
import { Flame, Loader2 } from "lucide-react";
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

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Backlog Heatmap</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Pinpoint where backlogs are accumulating across the school</p>
            </div>

            <div className="space-y-4">
                {heatmap.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <Flame size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/60">No active backlogs found in the system.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead><tr className="bg-[#F4F2EB]">
                                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Subject Name</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Semester</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Student Count</th>
                            </tr></thead>
                            <tbody className="divide-y divide-[#1C1C1A]/5">
                                {heatmap.map((row, i) => (
                                    <tr key={i} className="hover:bg-[#F4F2EB]/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-[#1C1C1A]">{row.subjectName}</p>
                                            <p className="text-[10px] font-mono text-[#1C1C1A]/40 uppercase tracking-tighter">{row.code}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-bold text-[#1C1C1A]/60 bg-[#F4F2EB] px-3 py-1 rounded-lg">Sem {row.semester}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className={`text-xl font-serif font-bold ${row.count >= 10 ? 'text-red-500' : row.count >= 5 ? 'text-amber-500' : 'text-[#1C1C1A]/60'}`}>
                                                {row.count}
                                            </span>
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
