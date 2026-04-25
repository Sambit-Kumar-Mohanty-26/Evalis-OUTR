"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight, GraduationCap, Loader2, Lock, Play, Trash2, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "sonner";

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

const yearRangeFromName = (name: string) => {
    const match = name.match(/(\d{4})[-–—](\d{4})/);
    if (!match) return null;
    return { startYear: Number(match[1]), endYear: Number(match[2]) };
};

interface BlueprintBranch {
    id: string;
    name: string;
}

interface BlueprintSchool {
    id: string;
    name: string;
    branches?: BlueprintBranch[];
}

interface BlueprintProgram {
    id: string;
    name: string;
    durationYears: number;
    schools?: BlueprintSchool[];
}

interface StudentRecord {
    id: string;
    fullName: string;
    email: string;
    rollNumber: string | null;
    currentSemester: number | null;
    status: string;
    cgpa?: number | null;
    batch?: { id: string; name: string } | null;
}

interface BatchSemester {
    id: string;
    semesterNumber: number;
    startDate: string;
    endDate: string;
    status: string;
}

interface Batch {
    id: string;
    name: string;
    branchId: string;
    startYear: number;
    endYear: number;
    totalSemesters: number;
    currentSemester: number;
    status: string;
    isLocked: boolean;
    branch: {
        name: string;
        school: { name: string; program: { name: string } };
    };
    semesterTimelines: BatchSemester[];
    _count: { students: number };
}

export default function BranchDetailPage() {
    const params = useParams<{ cohort: string; branchId: string }>();
    const cohortKey = decodeURIComponent(params.cohort);
    const branchId = params.branchId;

    const [programs, setPrograms] = useState<BlueprintProgram[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [promoting, setPromoting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [structureRes, batchRes, userRes] = await Promise.allSettled([
                api.get<{ programs?: BlueprintProgram[] }>("/api/v1/academic/structure?versionId=current"),
                api.get<{ batches: Batch[] }>("/api/v1/batch"),
                api.get<{ users: StudentRecord[] }>("/api/v1/user?role=STUDENT&limit=500"),
            ]);
            if (structureRes.status === "fulfilled") setPrograms(structureRes.value.programs || []);
            if (batchRes.status === "fulfilled") {
                setBatches(batchRes.value.batches || []);
            }
            else toast.error(getErrorMessage(batchRes.reason, "Failed to load batches"));
            if (userRes.status === "fulfilled")      setStudents(userRes.value.users || []);
            else toast.error(getErrorMessage(userRes.reason, "Failed to load students"));
        } finally {
            setLoading(false);
        }
    }, [branchId, cohortKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const blueprintBranch = programs
        .flatMap((program) => (program.schools || []).flatMap((school) =>
            (school.branches || []).map((branch) => ({ branch, school, program }))
        ))
        .find((entry) => entry.branch.id === branchId);

    const batch = batches.find((item) => {
        const parsedYears = yearRangeFromName(item.name);
        const key = `${parsedYears?.startYear || item.startYear}-${parsedYears?.endYear || item.endYear}`;
        return key === cohortKey && item.branchId === branchId;
    });

    const branchStudents = batch ? students.filter((student) => student.batch?.id === batch.id) : [];
    const averageCgpa = branchStudents.length
        ? branchStudents.reduce((sum, student) => sum + (student.cgpa || 0), 0) / branchStudents.length
        : 0;

    const handlePromote = async () => {
        if (!batch) return;
        if (!confirm("Run semester promotion for this branch? This action cannot be undone.")) return;
        setPromoting(true);
        try {
            const data = await api.post<{
                errors?: string[];
                promoted: number;
                promotedWithBacklog: number;
                notPromoted: number;
                movedToNextCohort: number;
                graduated: number;
            }>(`/api/v1/batch/${batch.id}/promote`);
            const promotionErrors = data.errors || [];
            if (promotionErrors.length > 0) {
                toast.error(promotionErrors[0]);
            } else {
                const parts = [
                    `Promoted: ${data.promoted}`,
                    `With backlog: ${data.promotedWithBacklog}`,
                    data.movedToNextCohort > 0 ? `Year-back (moved): ${data.movedToNextCohort}` : null,
                    data.graduated > 0 ? `Graduated: ${data.graduated}` : null,
                ].filter(Boolean).join(" · ");
                toast.success(`Promotion complete — ${parts}`);
            }
            fetchData();
        } catch {
            toast.error("Promotion failed");
        } finally {
            setPromoting(false);
        }
    };

    const handleDeleteStudent = async (studentId: string, studentName: string) => {
        toast.warning(
            `Permanently delete ${studentName}? This cannot be undone.`,
            {
                action: {
                    label: "Delete",
                    onClick: async () => {
                        setDeletingId(studentId);
                        try {
                            await api.delete(`/api/v1/user/${studentId}`);
                            toast.success(`${studentName} has been removed.`);
                            fetchData();
                        } catch (error: unknown) {
                            toast.error(getErrorMessage(error, "Failed to delete student"));
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
                cancel: { label: "Cancel", onClick: () => {} },
                duration: 8000,
            }
        );
    };

    const handleToggleLock = async () => {
        if (!batch) return;
        try {
            await api.post(`/api/v1/batch/${batch.id}/lock`);
            toast.success("Batch lock toggled");
            fetchData();
        } catch {
            toast.error("Failed to toggle lock");
        }
    };

    const semStatusColor = (status: string) => {
        if (status === "COMPLETED") return "bg-emerald-500";
        if (status === "ONGOING") return "bg-brand-green animate-pulse";
        return "bg-gray-300";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-brand-green" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Link
                href={`/dashboard/batches/${encodeURIComponent(cohortKey)}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1C1A]/40 hover:text-brand-green transition-colors"
            >
                <ArrowLeft size={14} /> Back to {cohortKey}
            </Link>

            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-bold tracking-[0.2em] uppercase mb-2">
                        <GraduationCap size={14} /> Branch Detail
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#1C1C1A]">
                        {blueprintBranch?.branch.name || batch?.branch.name || "Branch"}
                    </h1>
                    <p className="text-sm text-[#1C1C1A]/50 mt-1">
                        {blueprintBranch
                            ? `${blueprintBranch.school.name} / ${blueprintBranch.program.name}`
                            : batch
                            ? `${batch.branch.school.name} / ${batch.branch.school.program.name}`
                            : "Blueprint branch"}
                    </p>
                </div>
                {batch && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleLock}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1C1C1A]/50 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                            {batch.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                            {batch.isLocked ? "Unlock" : "Lock"}
                        </button>
                        {batch.status === "ONGOING" && (
                            <button
                                onClick={handlePromote}
                                disabled={promoting}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {promoting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                Run Promotion
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Metric label="Students" value={branchStudents.length} />
                <Metric label="Current Sem" value={batch ? `${batch.currentSemester} / ${batch.totalSemesters}` : "No batch"} />
                <Metric label="Status" value={batch?.status || "Not Created"} />
                <Metric label="Avg CGPA" value={averageCgpa ? averageCgpa.toFixed(2) : "—"} />
            </div>

            {!batch ? (
                <div className="bg-white/60 border border-dashed border-[#1C1C1A]/10 rounded-3xl p-12 text-center">
                    <CalendarDays size={42} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                    <h2 className="text-xl font-bold text-[#1C1C1A]">No branch batch created yet</h2>
                    <p className="text-sm text-[#1C1C1A]/40 mt-2">
                        This branch exists in the Academic Blueprint, but does not yet have a {cohortKey} batch.
                    </p>
                </div>
            ) : (
                <>
                    {/* Semester Timeline */}
                    <section className="bg-white/70 border border-[#1C1C1A]/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-4">Semester Timeline</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {batch.semesterTimelines.map((timeline) => (
                                <div key={timeline.id} className="flex items-center gap-3 bg-[#F4F2EB] rounded-xl px-4 py-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${semStatusColor(timeline.status)}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-[#1C1C1A]">Sem {timeline.semesterNumber}</div>
                                        <div className="text-[10px] text-[#1C1C1A]/40">
                                            {new Date(timeline.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                            {" – "}
                                            {new Date(timeline.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase shrink-0 ${
                                        timeline.status === "COMPLETED" ? "text-emerald-600"
                                        : timeline.status === "ONGOING" ? "text-brand-green"
                                        : "text-[#1C1C1A]/30"
                                    }`}>
                                        {timeline.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Students Table */}
                    <section className="bg-white/70 border border-[#1C1C1A]/5 rounded-3xl p-6">
                        <h2 className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-4">
                            Students <span className="ml-1 font-normal text-[#1C1C1A]/25">({branchStudents.length})</span>
                        </h2>

                        {branchStudents.length === 0 ? (
                            <div className="bg-[#F4F2EB] border border-dashed border-[#1C1C1A]/10 rounded-xl px-6 py-8 text-center text-xs text-[#1C1C1A]/40">
                                No students assigned to this branch yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-[#1C1C1A]/5">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#F4F2EB]">
                                            <th className="text-left text-[10px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest px-5 py-3 whitespace-nowrap">Regd No</th>
                                            <th className="text-left text-[10px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest px-5 py-3">Name</th>
                                            <th className="text-left text-[10px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest px-5 py-3 whitespace-nowrap">Avg CGPA</th>
                                            <th className="text-left text-[10px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest px-5 py-3">Email</th>
                                            <th className="text-left text-[10px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest px-5 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1C1C1A]/5">
                                        {branchStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-[#F4F2EB]/60 transition-colors">
                                                <td className="px-5 py-3.5 text-xs font-bold text-[#1C1C1A]/60 whitespace-nowrap">
                                                    {student.rollNumber || "—"}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-[#1C1C1A]">{student.fullName}</div>
                                                    <div className="text-[10px] text-[#1C1C1A]/40">Sem {student.currentSemester || batch.currentSemester}</div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`text-sm font-bold ${student.cgpa ? "text-emerald-600" : "text-[#1C1C1A]/30"}`}>
                                                        {student.cgpa != null ? student.cgpa.toFixed(2) : "—"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-[#1C1C1A]/50 max-w-50 truncate">
                                                    {student.email}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={`/dashboard/batches/${encodeURIComponent(cohortKey)}/branches/${branchId}/students/${student.id}`}
                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline"
                                                        >
                                                            View Details <ChevronRight size={12} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteStudent(student.id, student.fullName)}
                                                            disabled={deletingId === student.id}
                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                                                        >
                                                            {deletingId === student.id
                                                                ? <Loader2 size={12} className="animate-spin" />
                                                                : <Trash2 size={12} />}
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
            <div className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-3">{label}</div>
            <div className="text-2xl font-bold text-[#1C1C1A]">{value}</div>
        </div>
    );
}
