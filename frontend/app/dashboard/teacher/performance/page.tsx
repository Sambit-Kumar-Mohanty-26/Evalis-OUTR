"use client";

import { useState, useEffect } from "react";
import { BarChart3, Loader2, Star, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

export default function TeacherPerformance() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/teacher/subjects')
            .then(d => setSubjects(d.subjects || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Subject Performance</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Detailed analysis of student performance in your classes</p>
            </div>

            <div className="space-y-6">
                {subjects.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <BarChart3 size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/40">No subject data found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {subjects.map((subject) => (
                            <SubjectPerformanceCard key={subject.id} subject={subject} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SubjectPerformanceCard({ subject }: { subject: any }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const load = async () => {
        if (stats) { setExpanded(!expanded); return; }
        setLoading(true);
        try {
            const d = await api.get(`/api/v1/dashboard/teacher/subjects/${subject.id}/stats`);
            setStats(d);
            setExpanded(true);
        } catch { } finally { setLoading(false); }
    };

    return (
        <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
            <button onClick={load} className="w-full p-6 flex items-center justify-between hover:bg-[#F4F2EB]/30 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
                        <TrendingUp size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-[#1C1C1A]">{subject.name}</p>
                        <p className="text-xs text-[#1C1C1A]/40 font-mono tracking-tighter uppercase">{subject.code}</p>
                    </div>
                </div>
                {loading ? <Loader2 size={16} className="animate-spin text-brand-green" /> : <span className="text-xs font-bold text-brand-green">{expanded ? 'Close Stats ↑' : 'Analyze Stats →'}</span>}
            </button>
            {expanded && stats && (
                <div className="px-6 pb-6 space-y-6 border-t border-[#1C1C1A]/5 pt-6 bg-[#F4F2EB]/10">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 text-center border border-[#1C1C1A]/5 shadow-sm"><div className="text-xl font-serif font-bold text-[#1C1C1A]">{stats.avgMarks}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Average</div></div>
                        <div className="bg-white rounded-2xl p-4 text-center border border-[#1C1C1A]/5 shadow-sm"><div className="text-xl font-serif font-bold text-emerald-500">{stats.passPercent}%</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Pass Rate</div></div>
                        <div className="bg-white rounded-2xl p-4 text-center border border-[#1C1C1A]/5 shadow-sm"><div className="text-xl font-serif font-bold text-[#1C1C1A]">{stats.totalResults}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Students</div></div>
                    </div>
                    {stats.highestStudents?.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-[#1C1C1A]/5 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mb-4 flex items-center gap-2"><Star size={12} /> Branch Highest Students</p>
                            <div className="space-y-2">
                                {stats.highestStudents.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-emerald-50/50 rounded-xl px-4 py-2.5 border border-emerald-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">{i+1}</div>
                                            <span className="text-sm font-bold text-[#1C1C1A]">{s.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-lg">{s.marks} marks • {s.grade}</span>
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
