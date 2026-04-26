"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Clock, Lock, Loader2, Users } from "lucide-react";
import { api } from "@/lib/api";

export default function TeacherSubjects() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [submissionStatus, setSubmissionStatus] = useState<any[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [subjectStudents, setSubjectStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);

    const [overview, setOverview] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            api.get('/api/v1/dashboard/teacher/overview').then(d => setOverview(d)),
            api.get('/api/v1/dashboard/teacher/subjects').then(d => setSubjects(d.subjects || [])),
            api.get('/api/v1/dashboard/teacher/submission-status').then(d => setSubmissionStatus(d.instances || [])),
        ]).catch(console.error).finally(() => setLoading(false));
    }, []);

    const loadSubjectDetail = async (id: string) => {
        setSelectedSubjectId(id);
        setStudentsLoading(true);
        try {
            const stData = await api.get(`/api/v1/dashboard/teacher/subjects/${id}/students`);
            setSubjectStudents(stData.students || []);
        } catch (e) { console.error(e); } finally { setStudentsLoading(false); }
    };

    const submissionBadge = (status: string) => {
        if (status === 'SUBMITTED') return <span className="flex items-center gap-1 text-emerald-500 text-xs font-black"><CheckCircle2 size={12} /> Submitted</span>;
        if (status === 'LOCKED') return <span className="flex items-center gap-1 text-amber-500 text-xs font-black"><Lock size={12} /> Locked</span>;
        return <span className="flex items-center gap-1 text-[#1C1C1A]/30 text-xs font-black"><Clock size={12} /> Pending</span>;
    };

    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

    if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-brand-green" size={32} /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div>
                <div className="flex items-center gap-2 text-brand-green text-xs font-black tracking-[0.2em] uppercase mb-2"><BookOpen size={14} /> Teacher</div>
                <h1 className="text-4xl font-serif text-[#1C1C1A]">My Subjects</h1>
                <p className="text-[#1C1C1A]/40 mt-1">{overview?.schoolName} · {overview?.branchName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-3xl p-16 text-center border border-[#1C1C1A]/5 shadow-sm">
                        <BookOpen size={48} className="text-[#1C1C1A]/10 mx-auto mb-4" />
                        <p className="text-lg font-serif text-[#1C1C1A]/40">No subjects assigned yet.</p>
                    </div>
                ) : subjects.map((subject, i) => (
                    <motion.div 
                        key={subject.id} 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.05 }} 
                        onClick={() => loadSubjectDetail(subject.id)} 
                        className={`bg-white rounded-3xl p-6 border cursor-pointer hover:shadow-lg transition-all ${selectedSubjectId === subject.id ? 'border-brand-green shadow-brand-green/10 shadow-lg' : 'border-[#1C1C1A]/5 shadow-sm'}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center"><BookOpen size={20} className="text-brand-green" /></div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] px-2 py-0.5 bg-[#F4F2EB] rounded-lg font-black text-[#1C1C1A]/40 uppercase tracking-tighter">{subject.semester?.branch?.name}</span>
                                <span className="text-[10px] font-bold text-[#1C1C1A]/30">Sem {subject.semester?.semesterNumber}</span>
                            </div>
                        </div>
                        <h3 className="text-base font-bold text-[#1C1C1A] mb-1">{subject.name}</h3>
                        <p className="text-xs text-[#1C1C1A]/40 font-mono mb-4">{subject.code}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-[#1C1C1A]/5">
                            <span className="text-xs text-[#1C1C1A]/40">{subject._count?.marks || 0} marks entered</span>
                            <span className="text-xs font-bold text-brand-green">View details →</span>
                        </div>
                    </motion.div>
                ))}

                {/* Subject Detail Panel */}
                {selectedSubjectId && (
                    <div className="col-span-2 bg-white rounded-3xl border border-[#1C1C1A]/5 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[#1C1C1A]/5 flex items-center justify-between bg-[#F4F2EB]">
                            <h3 className="font-bold text-[#1C1C1A]">{selectedSubject?.name} — Student List</h3>
                            <span className="text-xs text-[#1C1C1A]/40">{subjectStudents.length} students enrolled</span>
                        </div>
                        {studentsLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-green" size={24} /></div> : (
                            <table className="w-full">
                                <thead><tr className="border-b border-[#1C1C1A]/5">
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Roll No</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Name</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/40">Status</th>
                                </tr></thead>
                                <tbody className="divide-y divide-[#1C1C1A]/5">
                                    {subjectStudents.map(s => (
                                        <tr key={s.id} className="hover:bg-[#F4F2EB]/30 transition-colors">
                                            <td className="px-6 py-3 text-xs font-mono font-black text-[#1C1C1A]/40">{s.rollNumber}</td>
                                            <td className="px-6 py-3 text-sm font-bold text-[#1C1C1A]">{s.fullName}</td>
                                            <td className="px-6 py-3 text-right">{s.hasMarks ? <span className="text-xs text-emerald-500 font-black flex items-center gap-1 justify-end"><CheckCircle2 size={12} /> Marks Entered</span> : <span className="text-xs text-[#1C1C1A]/30 font-black">Pending</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Submission Status */}
                {submissionStatus.length > 0 && (
                    <div className="col-span-2 bg-white rounded-3xl border border-[#1C1C1A]/5 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/40 mb-4">Exam Submission Progress</h3>
                        <div className="space-y-2">
                            {submissionStatus.map(inst => (
                                <div key={inst.instanceId} className="flex items-center justify-between bg-[#F4F2EB] rounded-2xl px-4 py-3">
                                    <span className="text-sm font-bold text-[#1C1C1A]">{inst.instanceName}</span>
                                    {submissionBadge(inst.submissionStatus)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
