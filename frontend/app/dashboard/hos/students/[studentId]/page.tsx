"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    User, GraduationCap, ArrowLeft, 
    Loader2, Hash, TrendingUp,
    AlertCircle, FileText, Calendar,
    BookOpen, Award, CheckCircle2, XCircle
} from "lucide-react";
import { api } from "@/lib/api";

export default function StudentDetail() {
    const { studentId } = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) return;
        api.get(`/api/v1/dashboard/hos/students/${studentId}`)
            .then(setStudent)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-brand-green" size={40} />
            <p className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/20">Calibrating Profile Data...</p>
        </div>
    );

    if (!student) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <XCircle className="text-red-500/20" size={64} />
            <div className="text-center">
                <h2 className="text-2xl font-serif text-[#1C1C1A]">Identity Not Found</h2>
                <p className="text-[#1C1C1A]/40 mt-1">This student identity does not exist in the current grid.</p>
            </div>
            <button 
                onClick={() => router.back()}
                className="px-8 py-3 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10"
            >
                Return to Roster
            </button>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-2xl bg-white border border-[#1C1C1A]/5 flex items-center justify-center text-[#1C1C1A]/40 hover:text-brand-green hover:border-brand-green/20 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-[#1C1C1A]/5 rounded-full border border-[#1C1C1A]/5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/40">Student Profile</span>
                    </div>
                    <ChevronRight size={14} className="text-[#1C1C1A]/10" />
                    <h1 className="text-2xl font-serif font-bold text-[#1C1C1A]">{student.fullName}</h1>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Basic Info & Stats */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    {/* Identity Card */}
                    <div className="bg-white rounded-[40px] p-10 border border-[#1C1C1A]/5 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                        
                        <div className="w-24 h-24 rounded-3xl bg-brand-green/5 flex items-center justify-center text-brand-green mx-auto mb-6 border border-brand-green/10">
                            <User size={40} />
                        </div>
                        
                        <h2 className="text-2xl font-serif font-bold text-[#1C1C1A]">{student.fullName}</h2>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1C1C1A]/30 mt-1">{student.rollNumber || 'NO ROLL ID'}</p>
                        
                        <div className="mt-8 flex flex-col gap-3">
                            <div className="flex items-center justify-between p-4 bg-[#F8F7F2] rounded-2xl border border-[#1C1C1A]/5">
                                <div className="flex items-center gap-3 text-[#1C1C1A]/40">
                                    <GraduationCap size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Branch</span>
                                </div>
                                <span className="text-sm font-bold text-[#1C1C1A]">{student.batch?.branch?.name}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-[#F8F7F2] rounded-2xl border border-[#1C1C1A]/5">
                                <div className="flex items-center gap-3 text-[#1C1C1A]/40">
                                    <Calendar size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Semester</span>
                                </div>
                                <span className="text-sm font-bold text-[#1C1C1A]">{student.currentSemester}</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-white rounded-[40px] p-10 border border-[#1C1C1A]/5 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1C1C1A]/30">Academic Standing</h3>
                            <Award className="text-brand-green" size={20} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#1C1C1A]/20 uppercase tracking-widest">Current CGPA</p>
                                <p className="text-4xl font-serif font-bold text-[#1C1C1A]">{student.cgpa?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#1C1C1A]/20 uppercase tracking-widest">Backlogs</p>
                                <p className={`text-4xl font-serif font-bold ${student.backlogs?.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {student.backlogs?.length || 0}
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#1C1C1A]/5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1A]/30">Completion Progress</span>
                                <span className="text-[10px] font-black text-[#1C1C1A]">{((student.currentSemester / 8) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-[#F8F7F2] rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-brand-green rounded-full shadow-[0_0_12px_rgba(40,167,69,0.2)]" 
                                    style={{ width: `${(student.currentSemester / 8) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Details */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Active Backlogs */}
                    {student.backlogs?.length > 0 && (
                        <div className="bg-red-50/50 rounded-[40px] p-10 border border-red-100/50 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-[#1C1C1A]">Pending Backlogs</h3>
                                    <p className="text-xs text-red-500/60 font-medium uppercase tracking-widest">Requires immediate academic attention</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {student.backlogs.map((bl: any) => (
                                    <div key={bl.id} className="bg-white p-6 rounded-3xl border border-red-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-red-500/40 uppercase tracking-widest mb-1">{bl.subject.code}</p>
                                            <p className="font-bold text-[#1C1C1A]">{bl.subject.name}</p>
                                            <p className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest mt-1">Semester {bl.semesterNumber}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                            <FileText size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Result History */}
                    <div className="bg-white rounded-[40px] p-10 border border-[#1C1C1A]/5 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-green/5 flex items-center justify-center text-brand-green">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-serif font-bold text-[#1C1C1A]">Academic History</h3>
                                <p className="text-xs text-[#1C1C1A]/30 font-medium uppercase tracking-widest">Chronological record of published results</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {student.results?.length === 0 ? (
                                <div className="text-center py-12 opacity-20">
                                    <Hash size={40} className="mx-auto mb-4" />
                                    <p className="font-serif">No result history available.</p>
                                </div>
                            ) : (
                                student.results.map((res: any) => (
                                    <div key={res.id} className="flex items-center justify-between p-6 rounded-[28px] bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 group hover:bg-white hover:shadow-xl hover:border-brand-green/20 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${res.status === 'PASSED' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                                {res.status === 'PASSED' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest mb-1">{res.subject.code} • Sem {res.semesterNumber}</p>
                                                <p className="font-bold text-[#1C1C1A] text-lg group-hover:text-brand-green transition-colors">{res.subject.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest mb-1">Grade Points</p>
                                            <p className="text-2xl font-serif font-bold text-[#1C1C1A]">{res.gradePoints || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChevronRight({ className, size = 16 }: { className?: string, size?: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    );
}
