"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays, Plus, ChevronRight, Lock, Unlock,
    Users, GraduationCap, ArrowUpRight, Settings2, Clock,
    CheckCircle2, XCircle, AlertTriangle, Loader2, Play
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

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
    startYear: number;
    endYear: number;
    totalSemesters: number;
    currentSemester: number;
    status: string;
    autoPromote: boolean;
    isLocked: boolean;
    branch: {
        name: string;
        school: { name: string; program: { name: string; durationYears: number } };
    };
    semesterTimelines: BatchSemester[];
    _count: { students: number };
}

export default function BatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [promoting, setPromoting] = useState(false);

    // Create form
    const [programs, setPrograms] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedProgram, setSelectedProgram] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [startYear, setStartYear] = useState(new Date().getFullYear());

    const fetchBatches = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch`, {
                credentials: "include",
            });
            const data = await res.json();
            setBatches(data.batches || []);
        } catch {
            toast.error("Failed to load batches");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStructure = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/academic/structure?versionId=current`, {
                credentials: "include",
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.programs) setPrograms(data.programs);
        } catch {}
    }, []);

    useEffect(() => {
        fetchBatches();
        fetchStructure();
    }, [fetchBatches, fetchStructure]);

    const handleCreate = async () => {
        if (!selectedBranch || !startYear) {
            toast.error("Please select a branch and start year");
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ branchId: selectedBranch, startYear }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            toast.success("Batch created successfully!");
            setShowCreate(false);
            setSelectedProgram("");
            setSelectedBranch("");
            fetchBatches();
        } catch (err: any) {
            toast.error(err.message || "Failed to create batch");
        }
    };

    const handlePromote = async (batchId: string) => {
        if (!confirm("Are you sure you want to run semester promotion? This action cannot be undone.")) return;
        setPromoting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch/${batchId}/promote`, {
                method: "POST",
                credentials: "include",
            });
            const data = await res.json();
            if (data.errors?.length > 0) {
                toast.error(data.errors[0]);
            } else {
                toast.success(`Promotion complete! P: ${data.promoted}, XP: ${data.promotedWithBacklog}, X: ${data.notPromoted}`);
            }
            fetchBatches();
        } catch {
            toast.error("Promotion failed");
        } finally {
            setPromoting(false);
        }
    };

    const handleToggleLock = async (batchId: string) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/batch/${batchId}/lock`, {
                method: "POST",
                credentials: "include",
            });
            toast.success("Batch lock toggled");
            fetchBatches();
        } catch {
            toast.error("Failed to toggle lock");
        }
    };

    const filteredBranches = selectedProgram
        ? programs.find((p: any) => p.id === selectedProgram)?.schools?.flatMap((s: any) => s.branches || []) || []
        : [];

    const statusColor = (s: string) => s === 'PASSED' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200';
    const semStatusColor = (s: string) => {
        if (s === 'COMPLETED') return 'bg-emerald-500';
        if (s === 'ONGOING') return 'bg-brand-green animate-pulse';
        return 'bg-gray-300';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-brand-green text-xs font-bold tracking-[0.2em] uppercase mb-2">
                        <CalendarDays size={14} /> Batch Automation Engine
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-[#1C1C1A]">Batches</h1>
                    <p className="text-sm text-[#1C1C1A]/50 mt-1">Manage academic lifecycles, timelines, and promotions</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold hover:bg-[#2C2C2A] transition-colors shadow-lg"
                >
                    <Plus size={16} /> Create Batch
                </motion.button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CalendarDays size={18} className="text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">Active</span>
                    </div>
                    <div className="text-3xl font-bold text-[#1C1C1A]">{batches.filter(b => b.status === 'ONGOING').length}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <GraduationCap size={18} className="text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">Graduated</span>
                    </div>
                    <div className="text-3xl font-bold text-[#1C1C1A]">{batches.filter(b => b.status === 'PASSED').length}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users size={18} className="text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest">Total Students</span>
                    </div>
                    <div className="text-3xl font-bold text-[#1C1C1A]">{batches.reduce((sum, b) => sum + (b._count?.students || 0), 0)}</div>
                </div>
            </div>

            {/* Batch List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-green" size={32} />
                </div>
            ) : batches.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-16 text-center">
                    <CalendarDays size={48} className="mx-auto mb-4 text-[#1C1C1A]/20" />
                    <h3 className="text-lg font-bold text-[#1C1C1A]/60 mb-2">No Batches Yet</h3>
                    <p className="text-sm text-[#1C1C1A]/40">Create your first batch to start managing academic lifecycles.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {batches.map((batch) => (
                        <motion.div
                            key={batch.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/70 backdrop-blur-sm border border-[#1C1C1A]/5 rounded-3xl p-6 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                                        <CalendarDays size={22} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1C1C1A]">{batch.name}</h3>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-[#1C1C1A]/40">{batch.branch?.school?.program?.name}</span>
                                            <span className="text-[#1C1C1A]/10">•</span>
                                            <span className="text-xs text-[#1C1C1A]/40">{batch.branch?.school?.name}</span>
                                            <span className="text-[#1C1C1A]/10">•</span>
                                            <span className="text-xs text-[#1C1C1A]/40">{batch.branch?.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor(batch.status)}`}>
                                        {batch.status}
                                    </span>
                                    {batch.isLocked && <Lock size={14} className="text-amber-500" />}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="bg-[#F4F2EB] rounded-xl px-4 py-2.5">
                                    <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">Current Sem</div>
                                    <div className="text-lg font-bold text-[#1C1C1A]">{batch.currentSemester} / {batch.totalSemesters}</div>
                                </div>
                                <div className="bg-[#F4F2EB] rounded-xl px-4 py-2.5">
                                    <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">Students</div>
                                    <div className="text-lg font-bold text-[#1C1C1A]">{batch._count?.students || 0}</div>
                                </div>
                                <div className="bg-[#F4F2EB] rounded-xl px-4 py-2.5">
                                    <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">Duration</div>
                                    <div className="text-lg font-bold text-[#1C1C1A]">{batch.startYear}–{batch.endYear}</div>
                                </div>
                                <div className="bg-[#F4F2EB] rounded-xl px-4 py-2.5">
                                    <div className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">Auto Promote</div>
                                    <div className="text-lg font-bold text-[#1C1C1A]">{batch.autoPromote ? 'ON' : 'OFF'}</div>
                                </div>
                            </div>

                            {/* Semester Progress Bar */}
                            <div className="mb-4">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: batch.totalSemesters }, (_, i) => {
                                        const timeline = batch.semesterTimelines?.find(t => t.semesterNumber === i + 1);
                                        return (
                                            <div key={i} className="flex-1 group relative">
                                                <div className={`h-2 rounded-full ${semStatusColor(timeline?.status || 'PENDING')}`} />
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1C1C1A] text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap transition-opacity z-10">
                                                    Sem {i + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#1C1C1A]/5">
                                <button
                                    onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1C1C1A]/50 hover:text-[#1C1C1A] hover:bg-[#F4F2EB] rounded-lg transition-colors"
                                >
                                    <Clock size={12} /> Timeline
                                </button>
                                <button
                                    onClick={() => handleToggleLock(batch.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1C1C1A]/50 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                >
                                    {batch.isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                                    {batch.isLocked ? 'Unlock' : 'Lock'}
                                </button>
                                {batch.status === 'ONGOING' && (
                                    <button
                                        onClick={() => handlePromote(batch.id)}
                                        disabled={promoting}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors ml-auto disabled:opacity-50"
                                    >
                                        {promoting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                        Run Promotion
                                    </button>
                                )}
                            </div>

                            {/* Timeline Expand */}
                            <AnimatePresence>
                                {selectedBatch?.id === batch.id && batch.semesterTimelines?.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 pt-4 border-t border-[#1C1C1A]/5 space-y-2">
                                            <div className="text-xs font-bold text-[#1C1C1A]/40 uppercase tracking-widest mb-3">Semester Timeline</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {batch.semesterTimelines.map((t) => (
                                                    <div key={t.id} className="flex items-center gap-3 bg-[#F4F2EB] rounded-xl px-4 py-3">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${semStatusColor(t.status)}`} />
                                                        <div className="flex-1">
                                                            <div className="text-xs font-bold text-[#1C1C1A]">Semester {t.semesterNumber}</div>
                                                            <div className="text-[10px] text-[#1C1C1A]/40">
                                                                {new Date(t.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                                {' → '}
                                                                {new Date(t.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase ${t.status === 'COMPLETED' ? 'text-emerald-600' : t.status === 'ONGOING' ? 'text-brand-green' : 'text-[#1C1C1A]/30'}`}>
                                                            {t.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
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
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-[#1C1C1A] mb-6">Create New Batch</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Program</label>
                                    <select
                                        value={selectedProgram}
                                        onChange={(e) => { setSelectedProgram(e.target.value); setSelectedBranch(""); }}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                    >
                                        <option value="">Select Program</option>
                                        {programs.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Branch</label>
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                        disabled={!selectedProgram}
                                    >
                                        <option value="">Select Branch</option>
                                        {filteredBranches.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#1C1C1A]/50 uppercase tracking-widest block mb-2">Start Year</label>
                                    <input
                                        type="number"
                                        value={startYear}
                                        onChange={(e) => setStartYear(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-[#1C1C1A]/10 bg-white text-sm focus:outline-none focus:border-brand-green"
                                        min={2020}
                                        max={2035}
                                    />
                                </div>

                                {/* Preview */}
                                {selectedProgram && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <div className="text-xs font-bold text-emerald-700 mb-2">Auto-Generated Preview</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600">
                                            <div>End Year: <b>{startYear + (programs.find((p: any) => p.id === selectedProgram)?.durationYears || 4)}</b></div>
                                            <div>Semesters: <b>{(programs.find((p: any) => p.id === selectedProgram)?.durationYears || 4) * 2}</b></div>
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
