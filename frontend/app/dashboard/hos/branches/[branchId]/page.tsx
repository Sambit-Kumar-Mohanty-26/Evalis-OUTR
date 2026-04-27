"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
    Search, User, GraduationCap, ArrowLeft, 
    Loader2, ChevronRight, Hash, TrendingUp,
    AlertCircle, FileText
} from "lucide-react";
import { api } from "@/lib/api";

export default function BranchStudents() {
    const { branchId } = useParams();
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!branchId) return;
        api.get(`/api/v1/dashboard/hos/branches/${branchId}/students`)
            .then(d => setStudents(d.students || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [branchId]);

    const filteredStudents = students.filter(s => 
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-brand-green" size={40} />
            <p className="text-sm font-black uppercase tracking-widest text-[#1C1C1A]/20">Synthesizing Student Grid...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white border border-[#1C1C1A]/5 flex items-center justify-center text-[#1C1C1A]/40 hover:text-brand-green hover:border-brand-green/20 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-serif text-[#1C1C1A]">Student Roster</h1>
                        <p className="text-[#1C1C1A]/40 mt-1">Detailed academic performance of enrolled students</p>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 group-focus-within:text-brand-green transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-6 py-4 bg-white border border-[#1C1C1A]/5 rounded-2xl text-sm font-semibold text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none focus:border-brand-green/20 focus:shadow-xl transition-all w-80 shadow-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border border-[#1C1C1A]/5 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#F8F7F2]/50 border-b border-[#1C1C1A]/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Identity</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Academic Stats</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Risk Factor</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/30">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C1A]/5">
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-20">
                                        <Hash size={48} className="mb-4" />
                                        <p className="font-serif text-xl">No students match your query</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((student, i) => (
                                <motion.tr 
                                    key={student.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group hover:bg-[#F8F7F2]/30 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/hos/students/${student.id}`)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-green/5 flex items-center justify-center text-brand-green font-bold text-lg">
                                                {student.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-serif font-bold text-[#1C1C1A] text-lg group-hover:text-brand-green transition-colors">{student.fullName}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-widest">{student.rollNumber || 'NO ROLL ID'}</p>
                                                    <span className="text-[10px] font-black text-brand-green/60 uppercase tracking-widest bg-brand-green/5 px-2 py-0.5 rounded-md">{student.batchName}</span>
                                                </div>
                                            </div>

                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-[#1C1C1A]/20 uppercase tracking-widest">CGPA</p>
                                                <p className="text-xl font-serif font-bold text-[#1C1C1A]">{student.cgpa.toFixed(2)}</p>
                                            </div>
                                            <div className="w-px h-8 bg-[#1C1C1A]/5" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-[#1C1C1A]/20 uppercase tracking-widest">Last SGPA</p>
                                                <p className="text-xl font-serif font-bold text-[#1C1C1A]">{student.sgpa.toFixed(2)}</p>
                                            </div>
                                            <div className="w-px h-8 bg-[#1C1C1A]/5" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-[#1C1C1A]/20 uppercase tracking-widest">Sem</p>
                                                <p className="text-xl font-serif font-bold text-[#1C1C1A]">{student.semester}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {student.backlogs > 0 ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-500 w-fit">
                                                <AlertCircle size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{student.backlogs} Backlogs</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 w-fit">
                                                <TrendingUp size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Consistent</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1C1C1A]/20 group-hover:text-brand-green transition-all">
                                            View Profile <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
