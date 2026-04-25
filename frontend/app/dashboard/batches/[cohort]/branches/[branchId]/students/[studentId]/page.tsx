"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, GraduationCap, Loader2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

interface StudentDetail {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    rollNumber: string | null;
    currentSemester: number | null;
    status: string;
    cgpa?: number | null;
    attendancePercentage?: number | null;
    batch?: {
        id: string;
        name: string;
        branch: {
            name: string;
            school: {
                name: string;
                program: { name: string };
            };
        };
    } | null;
}

export default function StudentBatchDetailPage() {
    const params = useParams<{ cohort: string; branchId: string; studentId: string }>();
    const cohortKey = decodeURIComponent(params.cohort);
    const branchId = params.branchId;
    const studentId = params.studentId;

    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStudent = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get<StudentDetail>(`/api/v1/user/${studentId}`);
            setStudent(data);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load student details"));
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchStudent();
    }, [fetchStudent]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-brand-green" size={32} />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="space-y-6">
                <BackLink cohortKey={cohortKey} branchId={branchId} />
                <div className="bg-white/60 border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                    <UserRound size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                    <h1 className="text-2xl font-bold text-[#1C1C1A]">Student not found</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <BackLink cohortKey={cohortKey} branchId={branchId} />

            <div className="bg-white/70 border border-[#1C1C1A]/5 rounded-3xl p-8">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <UserRound size={28} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-brand-green uppercase tracking-widest">Student Profile</div>
                        <h1 className="text-4xl font-serif font-bold text-[#1C1C1A] mt-1">{student.fullName}</h1>
                        <p className="text-sm text-[#1C1C1A]/45 mt-1">
                            {student.rollNumber || "No roll number"} / {student.batch?.branch.name || "No branch"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Metric label="Current Sem" value={student.currentSemester || "-"} icon={<GraduationCap size={18} className="text-emerald-600" />} />
                <Metric label="CGPA" value={student.cgpa ?? "-"} icon={<ShieldCheck size={18} className="text-blue-600" />} />
                <Metric label="Attendance" value={student.attendancePercentage != null ? `${student.attendancePercentage}%` : "-"} icon={<ShieldCheck size={18} className="text-amber-600" />} />
                <Metric label="Status" value={student.status} icon={<ShieldCheck size={18} className="text-lime-700" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-white/70 border border-[#1C1C1A]/5 rounded-3xl p-6">
                    <h2 className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-4">Academic Placement</h2>
                    <Info label="Program" value={student.batch?.branch.school.program.name || "-"} />
                    <Info label="School" value={student.batch?.branch.school.name || "-"} />
                    <Info label="Branch" value={student.batch?.branch.name || "-"} />
                    <Info label="Batch" value={student.batch?.name || cohortKey} />
                </section>

                <section className="bg-white/70 border border-[#1C1C1A]/5 rounded-3xl p-6">
                    <h2 className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-4">Contact</h2>
                    <Info label="Email" value={student.email} icon={<Mail size={14} />} />
                    <Info label="Phone" value={student.phoneNumber || "-"} icon={<Phone size={14} />} />
                </section>
            </div>
        </div>
    );
}

function BackLink({ cohortKey, branchId }: { cohortKey: string; branchId: string }) {
    return (
        <Link href={`/dashboard/batches/${encodeURIComponent(cohortKey)}/branches/${branchId}`} className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1C1A]/40 hover:text-brand-green transition-colors">
            <ArrowLeft size={14} /> Back to Branch
        </Link>
    );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F2EB] flex items-center justify-center">{icon}</div>
                <span className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1C1C1A]">{value}</div>
        </div>
    );
}

function Info({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 border-b border-[#1C1C1A]/5 last:border-b-0">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1A]/35 uppercase tracking-widest">
                {icon}
                {label}
            </div>
            <div className="text-sm font-bold text-[#1C1C1A] text-right">{value}</div>
        </div>
    );
}
