"use client";

import { useState, useEffect } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

function GradeChip({ grade }: { grade: string }) {
    const colors: Record<string, string> = { O: 'bg-emerald-100 text-emerald-700', A: 'bg-green-100 text-green-700', B: 'bg-blue-100 text-blue-700', C: 'bg-cyan-100 text-cyan-700', D: 'bg-yellow-100 text-yellow-700', P: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-600' };
    return <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border border-current/10 ${colors[grade] || 'bg-gray-100 text-gray-600'}`}>{grade}</span>;
}

export default function StudentMarks() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/student/marks')
            .then(d => setResults(d.results || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const bySemester = results.reduce<Record<number, any[]>>((acc, r) => {
        const sem = r.semester || 0;
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(r);
        return acc;
    }, {});

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">My Marks</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Official academic records and semester-wise results</p>
            </div>

            <div className="space-y-8">
                {Object.keys(bySemester).length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <BookOpen size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/40">No published results yet.</p>
                        <p className="text-sm text-[#1C1C1A]/30 mt-1">Check back later once the evaluation cycle is complete.</p>
                    </div>
                ) : Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, semResults]) => (
                    <div key={sem} className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/40 ml-1">Semester {sem} Results</h3>
                        <div className="bg-white rounded-[2rem] border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead><tr className="bg-[#F4F2EB]">
                                    <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Course Name</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Marks</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Grade</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Status</th>
                                </tr></thead>
                                <tbody className="divide-y divide-[#1C1C1A]/5">
                                    {semResults.map((r, i) => (
                                        <tr key={i} className="hover:bg-[#F4F2EB]/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold text-[#1C1C1A]">{r.subjectName}</p>
                                                <p className="text-xs text-[#1C1C1A]/40 font-mono tracking-tighter uppercase">{r.subjectCode} · {r.creditHours} Credits</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-sm font-bold text-[#1C1C1A]">{r.totalMarks}</span>
                                                <span className="text-[10px] text-[#1C1C1A]/40 ml-2 bg-[#F4F2EB] px-1.5 py-0.5 rounded-md font-black">GP: {r.gradePoint}</span>
                                            </td>
                                            <td className="px-6 py-5 flex justify-center"><GradeChip grade={r.grade} /></td>
                                            <td className="px-6 py-5 text-right">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${r.status === 'PASSED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
