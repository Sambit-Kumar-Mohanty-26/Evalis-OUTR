"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, TrendingDown, CheckCircle, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";

export default function AdvisorAtRisk() {
    const [atRisk, setAtRisk] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        api.get('/api/v1/dashboard/advisor/at-risk')
            .then(d => setAtRisk(d.students || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const viewProfile = async (student: any) => {
        setSelectedStudent(student);
        setProfileLoading(true);
        try {
            const d = await api.get(`/api/v1/dashboard/advisor/students/${student.id}`);
            setProfileData(d);
        } catch { } finally { setProfileLoading(false); }
    };

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">At-Risk Students</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Students requiring academic intervention</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-50 text-red-500 text-xs font-black rounded-full uppercase tracking-wider">{atRisk.length} flagged students</span>
                </div>
                
                {atRisk.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <CheckCircle size={48} className="text-emerald-300 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/60">All students are performing well!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {atRisk.map((s, i) => (
                            <motion.div 
                                key={s.id} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: i * 0.05 }} 
                                onClick={() => viewProfile(s)} 
                                className="bg-white rounded-3xl p-5 border border-red-100 cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100/50">
                                        <TrendingDown size={20} className="text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1C1C1A]">{s.fullName}</p>
                                        <p className="text-xs text-[#1C1C1A]/40 font-mono uppercase tracking-tighter">{s.rollNumber} • Sem {s.currentSemester}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end max-w-md">
                                    {s.riskReasons.map((r: string, j: number) => (
                                        <span key={j} className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-wider border border-red-100/50">{r}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedStudent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }} onClick={e => e.stopPropagation()} className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
                            <div className="p-8 border-b border-[#1C1C1A]/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-serif font-bold text-[#1C1C1A]">{selectedStudent.fullName}</h2>
                                    <p className="text-xs text-[#1C1C1A]/40 mt-0.5">{selectedStudent.rollNumber} • Sem {selectedStudent.currentSemester}</p>
                                </div>
                                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-[#F4F2EB] rounded-xl"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                {profileLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-green" size={24} /></div> : profileData ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-[#F4F2EB] rounded-2xl p-4 text-center shadow-sm"><div className="text-2xl font-serif font-bold text-brand-green">{profileData.student?.cgpa || 'N/A'}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">CGPA</div></div>
                                            <div className="bg-[#F4F2EB] rounded-2xl p-4 text-center shadow-sm"><div className="text-2xl font-serif font-bold text-blue-500">{profileData.backlogs?.filter((b: any) => b.status === 'ACTIVE').length || 0}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Backlogs</div></div>
                                            <div className="bg-[#F4F2EB] rounded-2xl p-4 text-center shadow-sm"><div className="text-2xl font-serif font-bold text-[#1C1C1A]">{profileData.student?.status || 'ACTIVE'}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Status</div></div>
                                        </div>
                                        {profileData.semesterResults?.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/40 mb-3">Semester GPA History</h3>
                                                <div className="space-y-2">
                                                    {profileData.semesterResults.map((sr: any) => (
                                                        <div key={sr.id} className="flex items-center justify-between bg-[#F4F2EB] rounded-2xl px-4 py-3 border border-[#1C1C1A]/5">
                                                            <span className="text-sm font-bold text-[#1C1C1A]">Semester {sr.semesterNumber}</span>
                                                            <span className="text-sm font-black text-brand-green">SGPA: {sr.sgpa}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : <p className="text-center text-[#1C1C1A]/40">Could not load student profile.</p>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
