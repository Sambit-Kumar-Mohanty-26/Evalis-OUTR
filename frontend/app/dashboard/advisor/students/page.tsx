"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Filter, ChevronLeft, ChevronRight, X, Loader2, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function AdvisorStudents() {
    const [students, setStudents] = useState<any[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [semFilter, setSemFilter] = useState("");
    const [backlogFilter, setBacklogFilter] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '20', search, ...(semFilter && { semester: semFilter }), ...(backlogFilter && { hasBacklog: 'true' }) });
        try {
            const d = await api.get(`/api/v1/dashboard/advisor/students?${params}`);
            setStudents(d.students || []);
            setTotalStudents(d.total || 0);
            setTotalPages(d.totalPages || 1);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [page, search, semFilter, backlogFilter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const viewProfile = async (student: any) => {
        setSelectedStudent(student);
        setProfileLoading(true);
        try {
            const d = await api.get(`/api/v1/dashboard/advisor/students/${student.id}`);
            setProfileData(d);
        } catch { } finally { setProfileLoading(false); }
    };

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">Students</h1>
                <p className="text-[#1C1C1A]/40 mt-1">Directory of all students in your branch</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30" size={16} />
                        <input type="text" placeholder="Search name or roll number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 h-11 bg-white rounded-2xl border border-[#1C1C1A]/5 focus:outline-none text-sm" />
                    </div>
                    <select value={semFilter} onChange={e => { setSemFilter(e.target.value); setPage(1); }} className="h-11 px-4 bg-white rounded-2xl border border-[#1C1C1A]/5 text-sm font-bold focus:outline-none">
                        <option value="">All Semesters</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                    <button onClick={() => { setBacklogFilter(!backlogFilter); setPage(1); }} className={`h-11 px-4 rounded-2xl text-sm font-bold border transition-all flex items-center gap-2 ${backlogFilter ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white text-[#1C1C1A]/40 border-[#1C1C1A]/5'}`}>
                        <Filter size={14} /> {backlogFilter ? 'Showing Backlogs' : 'Filter Backlogs'}
                    </button>
                    <span className="text-sm text-[#1C1C1A]/40 font-medium">{totalStudents} students</span>
                </div>

                <div className="bg-white rounded-3xl border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
                    {loading ? <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div> : (
                        <>
                            <table className="w-full">
                                <thead><tr className="bg-[#F4F2EB]">
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Roll No</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Name</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Sem</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">CGPA</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Backlogs</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Action</th>
                                </tr></thead>
                                <tbody className="divide-y divide-[#1C1C1A]/5">
                                    {students.map(s => (
                                        <tr key={s.id} className="hover:bg-[#F4F2EB]/30 cursor-pointer" onClick={() => viewProfile(s)}>
                                            <td className="px-6 py-4 text-xs font-black text-[#1C1C1A]/40 font-mono">{s.rollNumber || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#1C1C1A]">{s.fullName}</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#1C1C1A]/60">Sem {s.currentSemester}</td>
                                            <td className="px-6 py-4 text-center"><span className={`font-bold text-sm ${(s.cgpa || 0) < 5 ? 'text-red-500' : 'text-brand-green'}`}>{s.cgpa || 'N/A'}</span></td>
                                            <td className="px-6 py-4 text-center">{s.backlogCount > 0 ? <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs font-black rounded-lg">{s.backlogCount}</span> : <CheckCircle size={16} className="text-emerald-400 mx-auto" />}</td>
                                            <td className="px-6 py-4 text-right"><span className="text-xs font-bold text-brand-green">View Profile →</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 bg-[#F4F2EB] flex items-center justify-between">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl bg-white border border-[#1C1C1A]/5 disabled:opacity-30 hover:bg-[#1C1C1A] hover:text-white transition-all"><ChevronLeft size={16} /></button>
                                <span className="text-xs font-bold text-[#1C1C1A]/40">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-xl bg-white border border-[#1C1C1A]/5 disabled:opacity-30 hover:bg-[#1C1C1A] hover:text-white transition-all"><ChevronRight size={16} /></button>
                            </div>
                        </>
                    )}
                </div>
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
                                            <div className="bg-[#F4F2EB] rounded-2xl p-4 text-center"><div className="text-2xl font-serif font-bold text-brand-green">{profileData.student?.cgpa || 'N/A'}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">CGPA</div></div>
                                            <div className="bg-[#F4F2EB] rounded-2xl p-4 text-center"><div className="text-2xl font-serif font-bold text-blue-500">{profileData.backlogs?.filter((b: any) => b.status === 'ACTIVE').length || 0}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Backlogs</div></div>
                                            <div className="bg-[#F4F2EB] rounded-2xl p-4 text-center"><div className="text-2xl font-serif font-bold text-[#1C1C1A]">{profileData.student?.status || 'ACTIVE'}</div><div className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40 mt-1">Status</div></div>
                                        </div>
                                        {profileData.semesterResults?.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/40 mb-3">Semester GPA History</h3>
                                                <div className="space-y-2">
                                                    {profileData.semesterResults.map((sr: any) => (
                                                        <div key={sr.id} className="flex items-center justify-between bg-[#F4F2EB] rounded-2xl px-4 py-3">
                                                            <span className="text-sm font-bold text-[#1C1C1A]">Semester {sr.semesterNumber}</span>
                                                            <span className="text-sm font-black text-brand-green">SGPA: {sr.sgpa}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {profileData.backlogs?.filter((b: any) => b.status === 'ACTIVE').length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-3">Active Backlogs</h3>
                                                <div className="space-y-2">
                                                    {profileData.backlogs.filter((b: any) => b.status === 'ACTIVE').map((b: any) => (
                                                        <div key={b.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                                                            <span className="text-sm font-bold text-[#1C1C1A]">{b.subject.name}</span>
                                                            <span className="text-xs font-black text-red-500">Sem {b.semesterNumber}</span>
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
