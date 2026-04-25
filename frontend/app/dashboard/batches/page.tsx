"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, Lock, Users, GraduationCap, Settings2, Loader2, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

const yearRangeFromName = (name: string) => {
    // Matches YYYY-YYYY anywhere in the name, commonly inside parentheses
    const match = name.match(/(\d{4})[-–—](\d{4})/);
    if (!match) return null;
    return { startYear: Number(match[1]), endYear: Number(match[2]) };
};

interface BlueprintBranch {
    id: string;
    name: string;
}

interface BranchOption extends BlueprintBranch {
    schoolName: string;
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
    batch?: { id: string; name: string } | null;
}

interface Batch {
    id: string;
    name: string;
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
    _count: { students: number };
    semesterTimelines?: {
        semesterNumber: number;
        startDate: string;
        endDate: string;
    }[];
}

interface CohortGroup {
    key: string;
    startYear: number;
    endYear: number;
    durationYears: number;
    label: string;
    batches: Batch[];
    schoolCount: number;
    studentsCount: number;
    currentSemester: number;
    totalSemesters: number;
    status: string;
    isLocked: boolean;
}

export default function BatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [structureLoading, setStructureLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const [programs, setPrograms] = useState<BlueprintProgram[]>([]);
    const [selectedProgram, setSelectedProgram] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [startYear, setStartYear] = useState(new Date().getFullYear());

    const fetchBatches = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get<{ batches: Batch[] }>("/api/v1/batch");
            setBatches(data.batches || []);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load batches"));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStructure = useCallback(async () => {
        try {
            setStructureLoading(true);
            const data = await api.get<{ programs?: BlueprintProgram[] }>("/api/v1/academic/structure?versionId=current");
            setPrograms(data.programs || []);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load academic blueprint"));
        } finally {
            setStructureLoading(false);
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        try {
            const data = await api.get<{ users: StudentRecord[] }>("/api/v1/user?role=STUDENT&limit=500");
            setStudents(data.users || []);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to load users"));
        }
    }, []);

    useEffect(() => {
        fetchBatches();
        fetchStructure();
        fetchStudents();
    }, [fetchBatches, fetchStructure, fetchStudents]);

    const studentsByBatchId = students.reduce<Record<string, number>>((acc, student) => {
        const batchId = student.batch?.id;
        if (!batchId) return acc;
        acc[batchId] = (acc[batchId] || 0) + 1;
        return acc;
    }, {});

    const cohorts = batches.reduce<CohortGroup[]>((groups, batch) => {
        const parsedYears = yearRangeFromName(batch.name);
        const start = parsedYears?.startYear || batch.startYear;
        const end = parsedYears?.endYear || batch.endYear;
        const key = `${start}-${end}`;
        let cohort = groups.find((group) => group.key === key);

        if (!cohort) {
            cohort = {
                key,
                startYear: start,
                endYear: end,
                durationYears: end - start,
                label: key,
                batches: [],
                schoolCount: 0,
                studentsCount: 0,
                currentSemester: batch.currentSemester,
                totalSemesters: batch.totalSemesters,
                status: "PASSED",
                isLocked: true,
            };
            groups.push(cohort);
        }

        cohort.batches.push(batch);
        cohort.schoolCount = new Set(cohort.batches.map((item) => item.branch.school.name)).size;
        cohort.studentsCount += studentsByBatchId[batch.id] || batch._count?.students || 0;
        cohort.status = cohort.batches.some((item) => item.status === "ONGOING") ? "ONGOING" : "PASSED";
        cohort.isLocked = cohort.batches.every((item) => item.isLocked);
        cohort.currentSemester = Math.min(...cohort.batches.map((item) => item.currentSemester));
        cohort.totalSemesters = Math.max(...cohort.batches.map((item) => item.totalSemesters));
        return groups;
    }, []).sort((a, b) => b.startYear - a.startYear);

    const filteredBranches: BranchOption[] = selectedProgram
        ? programs
            .find((program) => program.id === selectedProgram)
            ?.schools?.flatMap((school) =>
                (school.branches || []).map((branch) => ({
                    ...branch,
                    schoolName: school.name,
                }))
            ) || []
        : [];

    const selectedProgramDuration = programs.find((program) => program.id === selectedProgram)?.durationYears || 4;
    const totalBlueprintBranches = programs.reduce((total, program) => (
        total + (program.schools || []).reduce((schoolTotal, school) => schoolTotal + (school.branches?.length || 0), 0)
    ), 0);

    const handleCreate = async () => {
        if (!selectedBranch || !startYear) {
            toast.error("Please select a branch and start year");
            return;
        }

        try {
            await api.post("/api/v1/batch", { branchId: selectedBranch, startYear });
            toast.success("Batch created successfully");
            setShowCreate(false);
            setSelectedProgram("");
            setSelectedBranch("");
            fetchBatches();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Failed to create batch"));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-bold tracking-[0.2em] uppercase mb-2">
                        <CalendarDays size={14} /> Batch Automation Engine
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">Batches</h1>
                    <p className="text-sm text-[#1C1C1A]/50 mt-1">Open a batch year to manage schools, branches, timelines, and students.</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold hover:bg-[#2C2C2A] transition-colors shadow-lg"
                >
                    <Plus size={16} /> Create Branch Batch
                </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<CalendarDays size={18} className="text-emerald-600" />} label="Active Batches" value={cohorts.filter((cohort) => cohort.status === "ONGOING").length} tone="bg-emerald-100" />
                <StatCard icon={<GraduationCap size={18} className="text-amber-600" />} label="Graduated" value={cohorts.filter((cohort) => cohort.status === "PASSED").length} tone="bg-amber-100" />
                <StatCard icon={<Settings2 size={18} className="text-lime-700" />} label="Blueprint Branches" value={structureLoading ? "..." : totalBlueprintBranches} tone="bg-lime-100" />
                <StatCard icon={<Users size={18} className="text-blue-600" />} label="Total Students" value={students.length || cohorts.reduce((sum, cohort) => sum + cohort.studentsCount, 0)} tone="bg-blue-100" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-green" size={32} />
                </div>
            ) : cohorts.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                    <CalendarDays size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                    <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">No Batches Yet</h3>
                    <p className="text-sm text-[#1C1C1A]/40">Create your first branch batch to start grouping cohorts.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cohorts.map((cohort) => (
                        <Link key={cohort.key} href={`/dashboard/batches/${encodeURIComponent(cohort.key)}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 hover:shadow-lg hover:border-brand-green/20 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                                            <CalendarDays size={22} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1C1C1A]">{cohort.label}</h3>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-[#1C1C1A]/40">
                                                <span>{getBlueprintCounts(programs, cohort.durationYears).schools || cohort.schoolCount} schools</span>
                                                <span>/</span>
                                                <span>{getBlueprintCounts(programs, cohort.durationYears).branches || cohort.batches.length} branches</span>
                                                <span>/</span>
                                                <span>{cohort.studentsCount} students</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${cohort.status === "PASSED" ? "text-amber-600 bg-amber-50 border-amber-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"}`}>
                                            {cohort.status}
                                        </span>
                                        {cohort.isLocked && <Lock size={14} className="text-amber-500" />}
                                        <ChevronRight size={18} className="text-[#1C1C1A]/30" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <Metric label="Current Sem" value={`${cohort.currentSemester} / ${cohort.totalSemesters}`} />
                                    <Metric label="Students" value={cohort.studentsCount} />
                                    <Metric label="Duration" value={cohort.label} />
                                    <Metric label="Branches" value={getBlueprintCounts(programs, cohort.durationYears).branches || cohort.batches.length} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-[#1C1C1A]/5"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-[#1C1C1A] mb-6">Create Branch Batch</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Program</label>
                                    <select
                                        value={selectedProgram}
                                        onChange={(event) => { setSelectedProgram(event.target.value); setSelectedBranch(""); }}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                    >
                                        <option value="">Select Program</option>
                                        {programs.map((program) => (
                                            <option key={program.id} value={program.id}>{program.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Branch</label>
                                    <select
                                        value={selectedBranch}
                                        onChange={(event) => setSelectedBranch(event.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                        disabled={!selectedProgram}
                                    >
                                        <option value="">Select Branch</option>
                                        {filteredBranches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>{branch.schoolName} / {branch.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Start Year</label>
                                    <input
                                        type="number"
                                        value={startYear}
                                        onChange={(event) => setStartYear(parseInt(event.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                        min={2020}
                                        max={2035}
                                    />
                                </div>

                                {selectedProgram && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <div className="text-xs font-bold text-emerald-700 mb-2">Batch Preview</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600">
                                            <div>Batch: <b>{startYear}-{startYear + selectedProgramDuration}</b></div>
                                            <div>Semesters: <b>{selectedProgramDuration * 2}</b></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] rounded-xl hover:bg-[#F4F2EB] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!selectedBranch}
                                    className="px-5 py-2.5 bg-[#1C1C1A] text-white text-sm font-bold rounded-xl hover:bg-[#2C2C2A] transition-colors disabled:opacity-50"
                                >
                                    Create Batch
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function getBlueprintCounts(programs: BlueprintProgram[], durationYears: number) {
    const matchingPrograms = programs.filter((program) => program.durationYears === durationYears);
    return matchingPrograms.reduce(
        (counts, program) => {
            const schools = program.schools || [];
            counts.schools += schools.length;
            counts.branches += schools.reduce((sum, school) => sum + (school.branches?.length || 0), 0);
            return counts;
        },
        { schools: 0, branches: 0 }
    );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: string }) {
    return (
        <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center`}>
                    {icon}
                </div>
                <span className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-bold text-[#1C1C1A]">{value}</div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-[#F4F2EB] rounded-xl px-4 py-2.5">
            <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">{label}</div>
            <div className="text-lg font-bold text-[#1C1C1A]">{value}</div>
        </div>
    );
}
