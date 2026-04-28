"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
    Users, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
    Loader2, GraduationCap, ChevronRight as ChevronRightIcon
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserRecord {
    id: string;
    fullName: string;
    email: string;
    rollNumber: string | null;
    currentSemester: number | null;
    status: string;
    cgpa?: number | null;
    batch: {
        id: string;
        name: string;
        branch: {
            id: string;
            name: string;
            school: {
                id: string;
                name: string;
                program: { id: string; name: string };
            };
        };
    } | null;
}

interface Metadata {
    programs: { id: string; name: string }[];
    schools: { id: string; name: string; programId: string; orgNodeId: string }[];
    branches: { id: string; name: string; schoolId: string; orgNodeId: string }[];
    batches: { id: string; name: string; branchId: string }[];
    mappings?: any[];
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StudentAnalyticsListPage() {
    const router = useRouter();
    const [students, setStudents] = useState<UserRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [metadata, setMetadata] = useState<Metadata>({ programs: [], schools: [], branches: [], batches: [], mappings: [] });

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterSchool, setFilterSchool] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [filterBatchYear, setFilterBatchYear] = useState("");
    const [filterBatch, setFilterBatch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    
    // Sorting
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Search debounce
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 400);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [search]);

    // ─── Fetch Metadata ──────────────────────────────────────────────────────
    useEffect(() => {
        api.get("/api/v1/user/metadata").then(setMetadata).catch(console.error);
    }, []);

    // ─── Fetch Students ──────────────────────────────────────────────────────
    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("role", "STUDENT");

            if (debouncedSearch) params.set("search", debouncedSearch);
            if (filterSchool) params.set("schoolId", filterSchool);
            if (filterBranch) params.set("branchId", filterBranch);
            if (filterBatch) params.set("batchId", filterBatch);
            if (filterBatchYear) params.set("batchYear", filterBatchYear);
            if (filterStatus !== "all") params.set("status", filterStatus);
            if (sortBy) params.set("sortBy", sortBy);
            if (sortOrder) params.set("sortOrder", sortOrder);
            params.set("page", String(page));
            params.set("limit", String(limit));

            const data = await api.get(`/api/v1/user?${params.toString()}`);
            setStudents(data.users);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Fetch students error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, filterSchool, filterBranch, filterBatch, filterBatchYear, filterStatus, sortBy, sortOrder, page, limit]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);
    useEffect(() => { setPage(1); }, [debouncedSearch, filterSchool, filterBranch, filterBatch, filterBatchYear, filterStatus, sortBy, sortOrder]);

    const clearFilters = () => {
        setFilterSchool("");
        setFilterBranch("");
        setFilterBatchYear("");
        setFilterBatch("");
        setFilterStatus("all");
        setSortBy("");
        setSortOrder("desc");
    };

    const hasActiveFilters = filterSchool || filterBranch || filterBatch || filterBatchYear || filterStatus !== "all";

    return (
        <div className="space-y-8">
            {/* ── Page Header ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl font-serif text-[#1C1C1A] leading-tight mb-2">
                        Student Analytics
                    </h1>
                    <p className="text-[#1C1C1A]/40 text-base font-light">
                        Monitor academic performance, attendance, and risk profiles across cohorts.
                    </p>
                </div>
            </motion.div>

            {/* ── Search + Filter Bar ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="flex items-center gap-4"
            >
                <div className="relative flex-1 max-w-lg group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 group-focus-within:text-brand-green transition-colors" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by student name, email, or roll number..."
                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-[#1C1C1A]/5 rounded-2xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none focus:bg-white focus:shadow-lg focus:border-brand-green/20 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 hover:text-[#1C1C1A]/60">
                            <X size={16} />
                        </button>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
                        showFilters || hasActiveFilters
                            ? "bg-brand-green/10 border-brand-green/20 text-brand-green"
                            : "bg-white/50 border-[#1C1C1A]/5 text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white"
                    }`}
                >
                    <SlidersHorizontal size={16} />
                    Filters
                    {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-brand-green" />
                    )}
                </motion.button>

                {/* Stats badge */}
                <div className="ml-auto px-4 py-2 bg-white/40 rounded-xl border border-[#1C1C1A]/5 text-xs font-bold text-[#1C1C1A]/40">
                    {total} students
                </div>
            </motion.div>

            {/* ── Filter Panel (Collapsible) ──────────────────────────────── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 bg-white/40 backdrop-blur-md rounded-[28px] border border-[#1C1C1A]/5 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-[#1C1C1A]/60 uppercase tracking-widest">Filter By</span>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors">
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FilterSelect
                                    label="Academic Batch (Year)"
                                    value={filterBatchYear}
                                    onChange={(v) => { 
                                        setFilterBatchYear(v); 
                                        setFilterSchool(""); 
                                        setFilterBranch(""); 
                                        setFilterBatch(""); 
                                    }}
                                    options={(() => {
                                        const uniqueNames = Array.from(new Set((metadata.mappings || []).map(m => m.batchName)));
                                        return uniqueNames.sort().reverse().map(name => ({ value: name as string, label: name as string }));
                                    })()}
                                />

                                <FilterSelect
                                    label="School / Faculty"
                                    value={filterSchool}
                                    onChange={(v) => { setFilterSchool(v); setFilterBranch(""); setFilterBatch(""); }}
                                    options={(() => {
                                        if (filterBatchYear) {
                                            const filtered = (metadata.mappings || []).filter(m => m.batchName === filterBatchYear);
                                            const uniqueSchools = Array.from(new Set(filtered.map(m => JSON.stringify({ id: m.schoolId, name: m.schoolName }))));
                                            return uniqueSchools.map(s => JSON.parse(s as string)).map(s => ({ value: s.id, label: s.name }));
                                        }
                                        return metadata.schools.map(s => ({ value: s.id, label: s.name }));
                                    })()}
                                />

                                <FilterSelect
                                    label="Branch / Department"
                                    value={filterBranch}
                                    onChange={(v) => { 
                                        setFilterBranch(v); 
                                        setFilterBatch("");
                                        if (filterBatchYear && v) {
                                            const mapping = (metadata.mappings || []).find(m => m.batchName === filterBatchYear && m.branchId === v);
                                            if (mapping) setFilterBatch(mapping.batchId);
                                        }
                                    }}
                                    options={(() => {
                                        if (filterBatchYear) {
                                            const uniqueBranches = Array.from(new Set((metadata.mappings || [])
                                                .filter(m => m.batchName === filterBatchYear && (!filterSchool || m.schoolId === filterSchool))
                                                .map(m => JSON.stringify({ id: m.branchId, name: m.branchName }))));
                                            return uniqueBranches.map(b => JSON.parse(b as string)).map(m => ({ value: m.id, label: m.name }));
                                        }
                                        return metadata.branches.filter(b => !filterSchool || b.schoolId === filterSchool).map(b => ({ value: b.id, label: b.name }));
                                    })()}
                                />

                                <FilterSelect
                                    label="Status"
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                    options={[
                                        { value: "all", label: "All Statuses" },
                                        { value: "ACTIVE", label: "Active" },
                                        { value: "INACTIVE", label: "Inactive" },
                                    ]}
                                />

                                <FilterSelect
                                    label="Sort By"
                                    value={sortBy ? `${sortBy}-${sortOrder}` : ""}
                                    onChange={(v) => {
                                        if (v === "cgpa-desc") {
                                            setSortBy("cgpa");
                                            setSortOrder("desc");
                                        } else if (v === "cgpa-asc") {
                                            setSortBy("cgpa");
                                            setSortOrder("asc");
                                        } else {
                                            setSortBy("");
                                            setSortOrder("desc");
                                        }
                                    }}
                                    options={[
                                        { value: "cgpa-desc", label: "Highest CGPA first" },
                                        { value: "cgpa-asc", label: "Lowest CGPA first" },
                                    ]}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Data Table ──────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white/40 backdrop-blur-md rounded-[32px] border border-[#1C1C1A]/5"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-green/40" />
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#1C1C1A]/5 flex items-center justify-center">
                            <Users size={28} className="text-[#1C1C1A]/20" />
                        </div>
                        <p className="text-sm text-[#1C1C1A]/30 font-medium">No students found matching your criteria</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#1C1C1A]/5">
                                    <Th>Name</Th>
                                    <Th>Roll No.</Th>
                                    <Th>Program</Th>
                                    <Th>Branch</Th>
                                    <Th>Batch</Th>
                                    <Th>Semester</Th>
                                    <Th>CGPA</Th>
                                    <Th align="right">Action</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        onClick={() => router.push(`/dashboard/analytics/student/${u.id}`)}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.35 }}
                                        className="border-b border-[#1C1C1A]/[0.03] hover:bg-white transition-colors group cursor-pointer"
                                    >
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                                                    {u.fullName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[#1C1C1A]">{u.fullName}</span>
                                                    <span className="text-[10px] text-[#1C1C1A]/40 font-mono">{u.email}</span>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <span className="px-2.5 py-1 rounded-lg bg-[#1C1C1A]/5 text-[11px] font-mono font-bold text-[#1C1C1A]/60">
                                                {u.rollNumber || "—"}
                                            </span>
                                        </Td>
                                        <Td>{u.batch?.branch?.school?.program?.name || "—"}</Td>
                                        <Td>{u.batch?.branch?.name || "—"}</Td>
                                        <Td>{u.batch?.name || "—"}</Td>
                                        <Td>
                                            {u.currentSemester ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-[10px] font-bold text-purple-600 border border-purple-100">
                                                    Sem {u.currentSemester}
                                                </span>
                                            ) : "—"}
                                        </Td>
                                        <Td>
                                            <span className="font-bold text-brand-green font-mono text-xs">
                                                {u.cgpa ? Number(u.cgpa).toFixed(2) : "—"}
                                            </span>
                                        </Td>
                                        <Td align="right">
                                            <div className="flex justify-end">
                                                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <ChevronRightIcon size={16} />
                                                </div>
                                            </div>
                                        </Td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ───────────────────────────────────────────── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-5 border-t border-[#1C1C1A]/5">
                        <span className="text-xs text-[#1C1C1A]/30 font-medium">
                            Page {page} of {totalPages} • {total} total students
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-9 h-9 rounded-xl bg-white/60 border border-[#1C1C1A]/5 flex items-center justify-center text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                                const pageNum = start + i;
                                if (pageNum > totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                            page === pageNum
                                                ? "bg-[#1C1C1A] text-white shadow-lg"
                                                : "bg-white/60 border border-[#1C1C1A]/5 text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-9 h-9 rounded-xl bg-white/60 border border-[#1C1C1A]/5 flex items-center justify-center text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ─── Reusable Sub-Components ────────────────────────────────────────────────

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
    return (
        <th className={`px-6 py-4 text-[10px] uppercase tracking-[0.15em] font-bold text-[#1C1C1A]/30 ${align === "right" ? "text-right" : ""}`}>
            {children}
        </th>
    );
}

function Td({ children, muted, align }: { children: React.ReactNode; muted?: boolean; align?: "right" }) {
    return (
        <td className={`px-6 py-4 text-sm ${muted ? "text-[#1C1C1A]/40" : "text-[#1C1C1A]/70"} ${align === "right" ? "text-right" : ""}`}>
            {children}
        </td>
    );
}

function FilterSelect({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-widest">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] focus:outline-none focus:border-brand-green/20 focus:bg-white transition-all appearance-none cursor-pointer"
            >
                <option value="">All</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}
