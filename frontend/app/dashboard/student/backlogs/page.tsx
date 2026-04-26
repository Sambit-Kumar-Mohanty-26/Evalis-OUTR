"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function StudentBacklogs() {
    const [backlogs, setBacklogs] = useState<{ active: any[]; cleared: any[] }>({ active: [], cleared: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/v1/dashboard/student/backlogs')
            .then(d => setBacklogs(d))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Backlog Tracker</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Monitor your active and successfully cleared back papers</p>
            </div>

            <div className="space-y-10">
                <section>
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-4 ml-1">Active Backlogs ({backlogs.active.length})</h3>
                    {backlogs.active.length === 0 ? (
                        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-3xl p-12 text-center shadow-sm">
                            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                            <p className="font-serif text-emerald-800 text-xl font-bold">Excellent! No active backlogs.</p>
                            <p className="text-sm text-emerald-600/60 mt-1">Your academic record is clear for the current cycle.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {backlogs.active.map(b => (
                                <div key={b.id} className="bg-white border border-red-100 rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100/50 text-red-500 shadow-inner">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold text-[#1C1C1A]">{b.subject.name}</p>
                                        <p className="text-sm text-[#1C1C1A]/40 font-mono tracking-tighter uppercase">{b.subject.code} · Originally in Sem {b.semesterNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-red-100">Pending</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {backlogs.cleared.length > 0 && (
                    <section>
                        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-4 ml-1">History of Cleared Backlogs ({backlogs.cleared.length})</h3>
                        <div className="grid gap-3">
                            {backlogs.cleared.map(b => (
                                <div key={b.id} className="bg-white/40 border border-[#1C1C1A]/5 rounded-3xl px-6 py-4 flex items-center gap-4 opacity-70">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500"><CheckCircle size={20} /></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-[#1C1C1A]">{b.subject.name}</p>
                                        <p className="text-xs text-[#1C1C1A]/40 font-mono uppercase">{b.subject.code} · Cleared in subsequent attempt</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[10px] font-black rounded-lg uppercase border border-emerald-100">Cleared</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
