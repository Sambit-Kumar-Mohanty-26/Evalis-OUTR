"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Building2, CalendarDays, ChevronDown, ChevronRight, GraduationCap, Loader2, Users, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

const parseCohort = (cohort: string) => {
    const match = cohort.match(/(\d{4})[-–—](\d{4})/);
    if (!match) return null;
    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    return { startYear, endYear, durationYears: Math.max(1, endYear - startYear) };
};

const yearRangeFromName = (name: string) => {
    const match = name.match(/(\d{4})[-–—](\d{4})/);
    if (!match) return null;
    return { startYear: Number(match[1]), endYear: Number(match[2]) };
};

interface BlueprintBranch { id: string; name: string; }
interface BlueprintSchool { id: string; name: string; branches?: BlueprintBranch[]; }
interface BlueprintProgram { id: string; name: string; durationYears: number; schools?: BlueprintSchool[]; }
interface StudentRecord { id: string; batch?: { id: string; name: string } | null; }

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
        id?: string;
        name: string;
        school: { id?: string; name: string; program: { id?: string; name: string } };
    };
    _count: { students: number };
    semesterTimelines?: {
        semesterNumber: number;
        startDate: string;
        endDate: string;
    }[];
}

interface BranchRow { id: string; name: string; batch?: Batch; studentsCount: number; }
interface SchoolRow { id: string; name: string; programName: string; branches: BranchRow[]; }

export default function BatchDetailPage() {
    const params = useParams<{ cohort: string }>();
    const cohortKey = decodeURIComponent(params.cohort);
    const cohort = useMemo(() => parseCohort(cohortKey), [cohortKey]);

    const [programs, setPrograms] = useState<BlueprintProgram[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSchoolId, setSelectedSchoolId] = useState("");
    const [expandedSchoolId, setExpandedSchoolId] = useState("");
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [editingTimelines, setEditingTimelines] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

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
                const allBatches = batchRes.value.batches || [];
                setBatches(allBatches);

                // Pre-populate timeline if any batch has one
                const cohortBatches = allBatches.filter((b: any) => {
                    const parsed = yearRangeFromName(b.name);
                    return `${parsed?.startYear || b.startYear}-${parsed?.endYear || b.endYear}` === cohortKey;
                });
                const duration = cohort?.durationYears || (programs[0]?.durationYears) || 4;
                const totalSems = duration * 2;
                const defaultT = [];
                for (let i = 1; i <= totalSems; i++) {
                    const existing = cohortBatches.length > 0 
                        ? cohortBatches[0].semesterTimelines?.find((t: any) => t.semesterNumber === i)
                        : null;
                    
                    defaultT.push({
                        semesterNumber: i,
                        startDate: existing ? existing.startDate.split('T')[0] : "",
                        endDate: existing ? existing.endDate.split('T')[0] : ""
                    });
                }
                setEditingTimelines(defaultT);
            }
            else toast.error(getErrorMessage(batchRes.reason, "Failed to load batches"));
            if (userRes.status === "fulfilled")      setStudents(userRes.value.users || []);
        } finally {
            setLoading(false);
        }
    }, [cohortKey, cohort]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const studentsByBatchId = students.reduce<Record<string, number>>((acc, s) => {
        if (s.batch?.id) acc[s.batch.id] = (acc[s.batch.id] || 0) + 1;
        return acc;
    }, {});

    const cohortBatches = batches.filter((batch) => {
        const parsed = yearRangeFromName(batch.name);
        return `${parsed?.startYear || batch.startYear}-${parsed?.endYear || batch.endYear}` === cohortKey;
    });

    const matchingPrograms = cohort
        ? programs.filter((p) => p.durationYears === cohort.durationYears)
        : [];

    const batchByBranchId = new Map(cohortBatches.map((b) => [b.branchId, b]));

    // ── Build schools: structure first, then fill in from actual batches ────────
    const schools: SchoolRow[] = matchingPrograms.flatMap((program) =>
        (program.schools || []).map((school) => ({
            id: school.id,
            name: school.name,
            programName: program.name,
            branches: (school.branches || []).map((branch) => {
                const batch = batchByBranchId.get(branch.id);
                return {
                    id: branch.id,
                    name: branch.name,
                    batch,
                    studentsCount: batch ? studentsByBatchId[batch.id] || batch._count?.students || 0 : 0,
                };
            }),
        }))
    );

    // Add any school/branch that exists in batches but is missing from the structure
    // (happens when batches were created under a non-current academic version)
    for (const batch of cohortBatches) {
        const schoolName = batch.branch.school.name;
        const schoolId   = batch.branch.school.id || schoolName;

        const existing = schools.find((s) => s.id === schoolId || s.name === schoolName);
        if (!existing) {
            schools.push({
                id: schoolId,
                name: schoolName,
                programName: batch.branch.school.program.name,
                branches: [{
                    id: batch.branchId,
                    name: batch.branch.name,
                    batch,
                    studentsCount: studentsByBatchId[batch.id] || batch._count?.students || 0,
                }],
            });
        } else {
            const branchMissing = !existing.branches.some(
                (b) => b.id === batch.branchId || b.name === batch.branch.name
            );
            if (branchMissing) {
                existing.branches.push({
                    id: batch.branchId,
                    name: batch.branch.name,
                    batch,
                    studentsCount: studentsByBatchId[batch.id] || batch._count?.students || 0,
                });
            }
        }
    }
    // ────────────────────────────────────────────────────────────────────────────

    const selectedSchool   = schools.find((s) => s.id === selectedSchoolId) || schools[0];
    const schoolStudents   = selectedSchool?.branches.reduce((n, b) => n + b.studentsCount, 0) || 0;
    const schoolBatchCount = selectedSchool?.branches.filter((b) => b.batch).length || 0;
    const schoolActiveCount= selectedSchool?.branches.filter((b) => b.batch?.status === "ONGOING").length || 0;
    const totalStudents    = schools.reduce((n, s) => n + s.branches.reduce((m, b) => m + b.studentsCount, 0), 0);
    const totalBranches    = schools.reduce((n, s) => n + s.branches.length, 0);
    const activeBranches   = schools.reduce((n, s) => n + s.branches.filter((b) => b.batch?.status === "ONGOING").length, 0);

    useEffect(() => {
        if (schools[0]) {
            if (!selectedSchoolId) setSelectedSchoolId(schools[0].id);
            if (!expandedSchoolId) setExpandedSchoolId(schools[0].id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schools.length]);

    const handleSchoolClick = (id: string) => {
        setSelectedSchoolId(id);
        setExpandedSchoolId((prev) => (prev === id ? "" : id));
    };

    const handleUpdateCohortTimeline = async () => {
        const validTimelines = editingTimelines.filter(t => t.startDate && t.endDate);
        
        if (validTimelines.length === 0) {
            toast.error("Please fill in at least one semester timeline (start and end dates)");
            return;
        }

        try {
            setSaving(true);
            await api.post("/api/v1/batch/cohort-timeline", {
                cohortName: cohortKey,
                timelines: validTimelines
            });
            toast.success("Cohort timeline updated for all branches");
            setShowTimelineModal(false);
            fetchData();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to update cohort timeline";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-brand-green" size={32} />
            </div>
        );
    }

    // Only block if there are truly no batches AND no blueprint for this cohort
    if (!cohort || (schools.length === 0 && cohortBatches.length === 0)) {
        return (
            <div className="space-y-6">
                <BackLink />
                <div className="bg-white/60 border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                    <CalendarDays size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                    <h1 className="text-2xl font-bold text-[#1C1C1A]">No data for {cohortKey}</h1>
                    <p className="text-sm text-[#1C1C1A]/40 mt-2">
                        No batches or blueprint branches found for this cohort.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <BackLink />
                    <div className="flex items-center gap-2 text-brand-green text-xs font-bold tracking-[0.2em] uppercase mt-5 mb-2">
                        <CalendarDays size={14} /> Batch Detail
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#1C1C1A]">{cohortKey}</h1>
                    <p className="text-sm text-[#1C1C1A]/50 mt-1">
                        {schools.length > 0
                            ? `${[...new Set(schools.map((s) => s.programName))].join(", ")} — schools, branches, and students.`
                            : "Loading academic structure…"}
                    </p>
                </div>
                <button
                    onClick={() => setShowTimelineModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
                >
                    <CalendarDays size={14} />
                    Set Cohort Timeline
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <TopMetric icon={<Building2 size={18} className="text-emerald-600" />} label="Schools"         value={schools.length}  tone="bg-emerald-100" />
                <TopMetric icon={<GraduationCap size={18} className="text-amber-600" />} label="Branches"      value={totalBranches}   tone="bg-amber-100" />
                <TopMetric icon={<Users size={18} className="text-blue-600" />}           label="Students"      value={totalStudents}   tone="bg-blue-100" />
                <TopMetric icon={<CalendarDays size={18} className="text-lime-700" />}   label="Active Branches" value={activeBranches} tone="bg-lime-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Schools accordion */}
                <aside className="lg:col-span-4">
                    <div className="bg-white/60 border border-[#1C1C1A]/5 rounded-3xl p-5">
                        <h2 className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-4">Academic Schools</h2>
                        <div className="space-y-2">
                            {schools.map((school) => {
                                const isSelected = selectedSchool?.id === school.id;
                                const isExpanded = expandedSchoolId === school.id;
                                const studentCount = school.branches.reduce((n, b) => n + b.studentsCount, 0);

                                return (
                                    <div
                                        key={school.id}
                                        className={`rounded-2xl border overflow-hidden transition-all ${
                                            isSelected ? "border-brand-green/30 shadow-sm" : "border-[#1C1C1A]/5"
                                        }`}
                                    >
                                        <button
                                            onClick={() => handleSchoolClick(school.id)}
                                            className={`w-full px-4 py-4 text-left flex items-center justify-between gap-3 transition-colors ${
                                                isSelected
                                                    ? "bg-[#1C1C1A] text-white"
                                                    : "bg-white/80 text-[#1C1C1A] hover:bg-white"
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold truncate">{school.name}</div>
                                                <div className={`text-[10px] font-bold mt-1 ${isSelected ? "text-white/50" : "text-[#1C1C1A]/35"}`}>
                                                    {school.branches.length} branches · {studentCount} students
                                                </div>
                                            </div>
                                            <ChevronDown
                                                size={15}
                                                className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${isSelected ? "text-white/60" : "text-[#1C1C1A]/30"}`}
                                            />
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    key="branches"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-3 py-2 space-y-1 bg-[#F4F2EB]/60">
                                                        {school.branches.length === 0 ? (
                                                            <p className="text-[10px] text-[#1C1C1A]/35 px-2 py-1">No branches defined</p>
                                                        ) : school.branches.map((branch) => (
                                                            <Link
                                                                key={branch.id}
                                                                href={`/dashboard/batches/${encodeURIComponent(cohortKey)}/branches/${branch.id}`}
                                                                className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-bold text-[#1C1C1A] truncate">{branch.name}</div>
                                                                    <div className="text-[10px] text-[#1C1C1A]/40 mt-0.5">
                                                                        {branch.batch
                                                                            ? `${branch.studentsCount} students · Sem ${branch.batch.currentSemester}`
                                                                            : "No batch created"}
                                                                    </div>
                                                                </div>
                                                                <ChevronRight size={13} className="shrink-0 text-[#1C1C1A]/25 group-hover:text-brand-green transition-colors" />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Right: School stats */}
                <section className="lg:col-span-8">
                    {selectedSchool && (
                        <motion.div
                            key={selectedSchool.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/70 border border-[#1C1C1A]/5 rounded-3xl p-6 space-y-6 h-full"
                        >
                            <div>
                                <div className="text-xs font-bold text-brand-green uppercase tracking-widest">Selected School</div>
                                <h2 className="text-3xl font-bold text-[#1C1C1A] mt-1">{selectedSchool.name}</h2>
                                <p className="text-sm text-[#1C1C1A]/40">{selectedSchool.programName}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SmallMetric label="Branches"        value={selectedSchool.branches.length} />
                                <SmallMetric label="Batches Created" value={schoolBatchCount} />
                                <SmallMetric label="Active"          value={schoolActiveCount} />
                                <SmallMetric label="Students"        value={schoolStudents} />
                            </div>

                            <div>
                                <div className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-3">Branch Overview</div>
                                {selectedSchool.branches.length === 0 ? (
                                    <div className="bg-[#F4F2EB] rounded-2xl p-6 text-center">
                                        <p className="text-sm text-[#1C1C1A]/40">No branches defined under this school.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedSchool.branches.map((branch) => (
                                            <Link
                                                key={branch.id}
                                                href={`/dashboard/batches/${encodeURIComponent(cohortKey)}/branches/${branch.id}`}
                                                className="group rounded-2xl bg-[#F4F2EB] border border-transparent p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-[#1C1C1A] truncate">{branch.name}</div>
                                                        <div className="text-[10px] text-[#1C1C1A]/40 mt-1">
                                                            {branch.batch
                                                                ? `${branch.studentsCount} students · Sem ${branch.batch.currentSemester} / ${branch.batch.totalSemesters}`
                                                                : "No batch created yet"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {branch.batch && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                branch.batch.status === "ONGOING"
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                            }`}>
                                                                {branch.batch.status}
                                                            </span>
                                                        )}
                                                        <ChevronRight size={15} className="text-[#1C1C1A]/25 group-hover:text-brand-green transition-colors" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </section>
            </div>

            <AnimatePresence>
                {showTimelineModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
                        onClick={() => setShowTimelineModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-[#1C1C1A]/5 max-h-[90vh] overflow-y-auto"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-[#1C1C1A]">Global Cohort Timeline</h2>
                                    <p className="text-xs text-[#1C1C1A]/40 mt-1">Set academic dates for all branches in the {cohortKey} cohort</p>
                                </div>
                                <button onClick={() => setShowTimelineModal(false)} className="p-2 hover:bg-black/5 rounded-xl transition-colors text-[#1C1C1A]/40">
                                    <Trash2 size={18} className="rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {editingTimelines.map((t, idx) => (
                                    <div key={t.semesterNumber} className="p-4 bg-[#F4F2EB] rounded-2xl grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-2">
                                            <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">Sem</div>
                                            <div className="text-lg font-bold text-[#1C1C1A]">{t.semesterNumber}</div>
                                        </div>
                                        <div className="col-span-5">
                                            <label className="text-[9px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest block mb-1">Start Date</label>
                                            <input 
                                                type="date" 
                                                value={t.startDate}
                                                onChange={(e) => {
                                                    const newTimelines = [...editingTimelines];
                                                    newTimelines[idx].startDate = e.target.value;
                                                    setEditingTimelines(newTimelines);
                                                }}
                                                className="w-full bg-white border border-black/5 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-green/20 outline-none"
                                            />
                                        </div>
                                        <div className="col-span-5">
                                            <label className="text-[9px] font-bold text-[#1C1C1A]/40 uppercase tracking-widest block mb-1">End Date</label>
                                            <input 
                                                type="date" 
                                                value={t.endDate}
                                                onChange={(e) => {
                                                    const newTimelines = [...editingTimelines];
                                                    newTimelines[idx].endDate = e.target.value;
                                                    setEditingTimelines(newTimelines);
                                                }}
                                                className="w-full bg-white border border-black/5 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-brand-green/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setShowTimelineModal(false)} className="px-5 py-2.5 text-sm font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUpdateCohortTimeline} 
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {saving ? "Applying to All Branches..." : "Apply to All Branches"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BackLink() {
    return (
        <Link href="/dashboard/batches" className="inline-flex items-center gap-2 text-xs font-bold text-[#1C1C1A]/40 hover:text-brand-green transition-colors">
            <ArrowLeft size={14} /> Back to Batches
        </Link>
    );
}

function TopMetric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) {
    return (
        <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center`}>{icon}</div>
                <span className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-bold text-[#1C1C1A]">{value}</div>
        </div>
    );
}

function SmallMetric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl bg-[#F4F2EB] px-4 py-3">
            <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">{label}</div>
            <div className="text-xl font-bold text-[#1C1C1A]">{value}</div>
        </div>
    );
}
