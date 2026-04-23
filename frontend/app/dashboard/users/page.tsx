"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
    Users, GraduationCap, ShieldCheck, Search, SlidersHorizontal,
    Plus, Upload, X, ChevronLeft, ChevronRight, MoreHorizontal,
    Edit3, Trash2, Eye, KeyRound, UserPlus, Download,
    CheckCircle2, XCircle, AlertTriangle, Loader2, FileSpreadsheet
} from "lucide-react";
import AddUserModal from "@/components/dashboard/users/AddUserModal";
import BulkUploadModal from "@/components/dashboard/users/BulkUploadModal";
import SingleUserModal from "@/components/dashboard/users/SingleUserModal";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserRecord {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: "ADMIN" | "TEACHER" | "STUDENT" | "HEAD_OF_SCHOOL" | "ADVISOR";
    status: string;
    rollNumber: string | null;
    currentSemester: number | null;
    createdAt: string;
    managedNodes: { id: string; name: string; type: string; level: number }[];
    taughtSubjects: { id: string; name: string; code: string }[];
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
    metadata?: { primaryAdvisorNodeId?: string } | null;
}

interface Metadata {
    orgNodes: { id: string; name: string; type: string; level: number; parentId: string | null }[];
    programs: { id: string; name: string }[];
    schools: { id: string; name: string; programId: string; orgNodeId: string }[];
    branches: { id: string; name: string; schoolId: string; orgNodeId: string }[];
    batches: { id: string; name: string; branchId: string }[];
    subjects: { id: string; name: string; code: string }[];
}

type TabType = "teachers" | "students" | "admin";

// ─── Tab Config ──────────────────────────────────────────────────────────────
const tabs: { key: TabType; label: string; icon: any; role: string }[] = [
    { key: "teachers", label: "Teachers", icon: Users, role: "TEACHER" },
    { key: "students", label: "Students", icon: GraduationCap, role: "STUDENT" },
    { key: "admin", label: "Admin Roles", icon: ShieldCheck, role: "MANAGEMENT" },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("teachers");
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [metadata, setMetadata] = useState<Metadata>({ orgNodes: [], programs: [], schools: [], branches: [], batches: [], subjects: [] });

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterSchool, setFilterSchool] = useState("");
    const [filterBranch, setFilterBranch] = useState("");
    const [filterBatch, setFilterBatch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterProgram, setFilterProgram] = useState("");

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Action dropdown
    const [activeActionId, setActiveActionId] = useState<string | null>(null);
    const actionRef = useRef<HTMLDivElement>(null);

    // Single User Actions State
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userModalMode, setUserModalMode] = useState<"view" | "edit">("view");
    const [showUserModal, setShowUserModal] = useState(false);

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

    // ─── Fetch Users ─────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const tabConfig = tabs.find(t => t.key === activeTab);
            const params = new URLSearchParams();

            if (activeTab === "admin") {
                // Show all users who have managedNodes
            } else {
                params.set("role", tabConfig?.role || "");
            }

            if (debouncedSearch) params.set("search", debouncedSearch);
            if (filterSchool) params.set("schoolId", filterSchool);
            if (filterBranch) params.set("branchId", filterBranch);
            if (filterBatch) params.set("batchId", filterBatch);
            if (filterStatus !== "all") params.set("status", filterStatus);
            params.set("page", String(page));
            params.set("limit", String(limit));

            const data = await api.get(`/api/v1/user?${params.toString()}`);
            
            if (activeTab === "admin") {
                // Filter to only users with specific admin/head roles
                const adminRoles = ["ADMIN", "HEAD_OF_SCHOOL", "ADVISOR"];
                const filtered = data.users.filter((u: UserRecord) => adminRoles.includes(u.role));
                setUsers(filtered);
                setTotal(filtered.length);
            } else {
                setUsers(data.users);
                setTotal(data.total);
            }
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, debouncedSearch, filterSchool, filterBranch, filterBatch, filterStatus, page, limit]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { setPage(1); }, [activeTab, debouncedSearch, filterSchool, filterBranch, filterBatch, filterStatus]);

    // ─── Actions ─────────────────────────────────────────────────────────────
    const handleDelete = async (userId: string) => {
        toast.warning("Deactivate User?", {
            description: "They will no longer be able to log in to the platform.",
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await api.delete(`/api/v1/user/${userId}`);
                        toast.success("User deactivated successfully");
                        fetchUsers();
                    } catch (err: any) {
                        toast.error("Failed to deactivate", { description: err.message });
                    }
                }
            },
            cancel: { label: "Cancel", onClick: () => {} }
        });
        setActiveActionId(null);
    };

    const handleResetPassword = async (userId: string) => {
        toast.warning("Reset Password?", {
            description: "This will set the user's password to Evalis@2024.",
            action: {
                label: "Reset",
                onClick: async () => {
                    try {
                        await api.post(`/api/v1/user/${userId}/reset-password`);
                        toast.success("Password reset successfully");
                    } catch (err: any) {
                        toast.error("Failed to reset password", { description: err.message });
                    }
                }
            },
            cancel: { label: "Cancel", onClick: () => {} }
        });
        setActiveActionId(null);
    };

    const handleRemoveAdmin = async (userId: string, nodeId: string) => {
        try {
            await api.delete(`/api/v1/user/${userId}/admin/${nodeId}`);
            fetchUsers();
        } catch (err: any) {
            toast.error("Failed to remove administrative access", { description: err.message });
        }
    };

    const openUserModal = (userId: string, mode: "view" | "edit") => {
        setSelectedUserId(userId);
        setUserModalMode(mode);
        setShowUserModal(true);
    };

    // Close action dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isMenuContent = target.closest('[data-action-menu]');
            
            if (actionRef.current && !actionRef.current.contains(target) && !isMenuContent) {
                setActiveActionId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Filtered branches based on selected school
    const filteredBranches = filterSchool
        ? metadata.branches.filter(b => b.schoolId === filterSchool)
        : metadata.branches;

    const filteredBatches = filterBranch
        ? metadata.batches.filter(b => b.branchId === filterBranch)
        : metadata.batches;

    const clearFilters = () => {
        setFilterSchool("");
        setFilterBranch("");
        setFilterBatch("");
        setFilterStatus("all");
        setFilterProgram("");
    };

    const hasActiveFilters = filterSchool || filterBranch || filterBatch || filterStatus !== "all" || filterProgram;

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
                        User Management
                    </h1>
                    <p className="text-[#1C1C1A]/40 text-base font-light">
                        Orchestrate institutional identities — Faculty, Students & Administrative governance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/60 border border-[#1C1C1A]/10 text-[#1C1C1A] text-sm font-semibold hover:bg-white hover:shadow-lg transition-all duration-300"
                    >
                        <Upload size={16} />
                        CSV Upload
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1C1C1A] text-white text-sm font-semibold hover:bg-[#2a2a28] shadow-lg shadow-[#1C1C1A]/10 transition-all duration-300"
                    >
                        <UserPlus size={16} />
                        Add {activeTab === "students" ? "Student" : "Teacher"}
                    </motion.button>
                </div>
            </motion.div>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="flex gap-2 p-1.5 bg-white/40 backdrop-blur-sm rounded-2xl border border-[#1C1C1A]/5 w-fit"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            activeTab === tab.key
                                ? "text-white"
                                : "text-[#1C1C1A]/40 hover:text-[#1C1C1A]/70"
                        }`}
                    >
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-[#1C1C1A] rounded-xl shadow-lg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2.5">
                            <tab.icon size={16} className={activeTab === tab.key ? "text-brand-green" : ""} />
                            {tab.label}
                        </span>
                    </button>
                ))}
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
                        placeholder={activeTab === "students" ? "Search by name, email, or roll number..." : "Search by name or email..."}
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
                    {total} {activeTab === "students" ? "students" : activeTab === "admin" ? "admins" : "teachers"}
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
                                {activeTab !== "students" && (
                                    <FilterSelect
                                        label="School"
                                        value={filterSchool}
                                        onChange={(v) => { setFilterSchool(v); setFilterBranch(""); setFilterBatch(""); }}
                                        options={metadata.schools.map(s => ({ value: s.id, label: s.name }))}
                                    />
                                )}
                                {activeTab === "students" && (
                                    <FilterSelect
                                        label="Program"
                                        value={filterProgram}
                                        onChange={setFilterProgram}
                                        options={metadata.programs.map(p => ({ value: p.id, label: p.name }))}
                                    />
                                )}
                                <FilterSelect
                                    label="Branch / Department"
                                    value={filterBranch}
                                    onChange={(v) => { setFilterBranch(v); setFilterBatch(""); }}
                                    options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
                                />
                                {activeTab === "students" && (
                                    <FilterSelect
                                        label="Batch"
                                        value={filterBatch}
                                        onChange={setFilterBatch}
                                        options={filteredBatches.map(b => ({ value: b.id, label: b.name }))}
                                    />
                                )}
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
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#1C1C1A]/5 flex items-center justify-center">
                            <Users size={28} className="text-[#1C1C1A]/20" />
                        </div>
                        <p className="text-sm text-[#1C1C1A]/30 font-medium">No {activeTab} found</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-xs font-bold text-brand-green hover:underline"
                        >
                            + Add your first {activeTab === "students" ? "student" : "teacher"}
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#1C1C1A]/5">
                                    {activeTab === "teachers" && (
                                        <>
                                            <Th>Name</Th>
                                            <Th>Email</Th>
                                            <Th>Phone</Th>
                                            <Th>School</Th>
                                            <Th>Department</Th>
                                            <Th>Status</Th>
                                            <Th align="right">Actions</Th>
                                        </>
                                    )}
                                    {activeTab === "students" && (
                                        <>
                                            <Th>Name</Th>
                                            <Th>Roll No.</Th>
                                            <Th>Email</Th>
                                            <Th>Program</Th>
                                            <Th>Branch</Th>
                                            <Th>Batch</Th>
                                            <Th>Semester</Th>
                                            <Th>Status</Th>
                                            <Th align="right">Actions</Th>
                                        </>
                                    )}
                                    {activeTab === "admin" && (
                                        <>
                                            <Th>Name</Th>
                                            <Th>Email</Th>
                                            <Th>Role</Th>
                                            <Th>Managed School</Th>
                                            <Th>Managed Branch</Th>
                                            <Th align="right">Actions</Th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.35 }}
                                        className="border-b border-[#1C1C1A]/[0.03] hover:bg-white/60 transition-colors group"
                                    >
                                        {activeTab === "teachers" && (
                                            <>
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs border border-brand-green/10">
                                                            {u.fullName.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-[#1C1C1A]">{u.fullName}</span>
                                                    </div>
                                                </Td>
                                                <Td muted>{u.email}</Td>
                                                <Td muted>{u.phoneNumber || "—"}</Td>
                                                <Td>
                                                    {(() => {
                                                        const seen = new Set();
                                                        return u.managedNodes
                                                            .filter(n => n.level === 2 || n.type === "SCHOOL")
                                                            .filter(n => {
                                                                const normalized = n.name.trim().toLowerCase().replace(/s$/, "");
                                                                if (seen.has(normalized)) return false;
                                                                seen.add(normalized);
                                                                return true;
                                                            })
                                                            .map(n => n.name)
                                                            .join(", ") || "—";
                                                    })()}
                                                </Td>
                                                <Td>
                                                    {(() => {
                                                        const seen = new Set();
                                                        return u.managedNodes
                                                            .filter(n => n.level === 3 || n.type === "BRANCH" || n.type === "DEPARTMENT")
                                                            .filter(n => {
                                                                const normalized = n.name.trim().toLowerCase().replace(/s$/, "");
                                                                if (seen.has(normalized)) return false;
                                                                seen.add(normalized);
                                                                return true;
                                                            })
                                                            .map(n => n.name)
                                                            .join(", ") || "—";
                                                    })()}
                                                </Td>
                                                <Td><StatusBadge status={u.status} /></Td>
                                                <Td align="right">
                                                    <ActionMenu
                                                        userId={u.id}
                                                        activeId={activeActionId}
                                                        setActiveId={setActiveActionId}
                                                        onView={() => openUserModal(u.id, "view")}
                                                        onEdit={() => openUserModal(u.id, "edit")}
                                                        onDelete={() => handleDelete(u.id)}
                                                        onReset={() => handleResetPassword(u.id)}
                                                        ref={activeActionId === u.id ? actionRef : null}
                                                    />
                                                </Td>
                                            </>
                                        )}
                                        {activeTab === "students" && (
                                            <>
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                                                            {u.fullName.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-[#1C1C1A]">{u.fullName}</span>
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <span className="px-2.5 py-1 rounded-lg bg-[#1C1C1A]/5 text-[11px] font-mono font-bold text-[#1C1C1A]/60">
                                                        {u.rollNumber || "—"}
                                                    </span>
                                                </Td>
                                                <Td muted>{u.email}</Td>
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
                                                <Td><StatusBadge status={u.status} /></Td>
                                                <Td align="right">
                                                    <ActionMenu
                                                        userId={u.id}
                                                        activeId={activeActionId}
                                                        setActiveId={setActiveActionId}
                                                        onView={() => openUserModal(u.id, "view")}
                                                        onEdit={() => openUserModal(u.id, "edit")}
                                                        onDelete={() => handleDelete(u.id)}
                                                        onReset={() => handleResetPassword(u.id)}
                                                        ref={activeActionId === u.id ? actionRef : null}
                                                    />
                                                </Td>
                                            </>
                                        )}
                                        {activeTab === "admin" && (
                                            <>
                                                <Td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs border border-amber-100">
                                                            {u.fullName.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-[#1C1C1A]">{u.fullName}</span>
                                                    </div>
                                                </Td>
                                                <Td muted>{u.email}</Td>
                                                <Td>
                                                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-[11px] font-bold text-amber-700 border border-amber-100">
                                                        {u.role}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    {(() => {
                                                        const seen = new Set();
                                                        return u.managedNodes
                                                            .filter(n => n.level === 2 || n.type === "SCHOOL")
                                                            .filter(n => {
                                                                const normalized = n.name.trim().toLowerCase().replace(/s$/, "");
                                                                if (seen.has(normalized)) return false;
                                                                seen.add(normalized);
                                                                return true;
                                                            })
                                                            .map(n => u.role === "HEAD_OF_SCHOOL" ? `${n.name} (HOS)` : n.name)
                                                            .join(", ") || "—";
                                                    })()}
                                                </Td>
                                                <Td>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(() => {
                                                            const seen = new Set();
                                                            return u.managedNodes
                                                                .filter(n => n.level === 3 || n.type === "BRANCH" || n.type === "DEPARTMENT")
                                                                .filter(n => {
                                                                    const normalized = n.name.trim().toLowerCase().replace(/s$/, "");
                                                                    if (seen.has(normalized)) return false;
                                                                    seen.add(normalized);
                                                                    return true;
                                                                })
                                                                .map(n => {
                                                                    const isAdvisor = u.role === "ADVISOR" && u.metadata?.primaryAdvisorNodeId === n.id;
                                                                    return (
                                                                        <span key={n.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                                            isAdvisor 
                                                                                ? "bg-blue-50 text-blue-600 border-blue-100" 
                                                                                : "bg-brand-green/8 text-brand-green border-brand-green/10"
                                                                        }`}>
                                                                            {n.name} {isAdvisor && "(Advisor)"}
                                                                            <button
                                                                                onClick={() => handleRemoveAdmin(u.id, n.id)}
                                                                                className="hover:text-red-500 transition-colors opacity-40 hover:opacity-100"
                                                                            >
                                                                                <X size={10} />
                                                                            </button>
                                                                        </span>
                                                                    );
                                                                });
                                                        })()}
                                                    </div>
                                                </Td>
                                                <Td align="right">
                                                    <ActionMenu
                                                        userId={u.id}
                                                        activeId={activeActionId}
                                                        setActiveId={setActiveActionId}
                                                        onView={() => openUserModal(u.id, "view")}
                                                        onEdit={() => openUserModal(u.id, "edit")}
                                                        onDelete={() => handleDelete(u.id)}
                                                        onReset={() => handleResetPassword(u.id)}
                                                        ref={activeActionId === u.id ? actionRef : null}
                                                    />
                                                </Td>
                                            </>
                                        )}
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
                            Page {page} of {totalPages} • {total} total records
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

            {/* ── Footer Tag ──────────────────────────────────────────────── */}
            <div className="pt-4 text-center text-[10px] text-[#1C1C1A]/15 font-sans tracking-[0.3em] uppercase">
                Evalis User Authority Protocol • v2.0
            </div>

            {/* ── Modals ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showAddModal && (
                    <AddUserModal
                        isOpen={showAddModal}
                        activeTab={activeTab}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => { setShowAddModal(false); fetchUsers(); }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showBulkModal && (
                    <BulkUploadModal
                        activeTab={activeTab}
                        metadata={metadata}
                        onClose={() => setShowBulkModal(false)}
                        onSuccess={() => { setShowBulkModal(false); fetchUsers(); }}
                    />
                )}

                {showUserModal && selectedUserId && (
                    <SingleUserModal 
                        userId={selectedUserId}
                        mode={userModalMode}
                        metadata={metadata}
                        onClose={() => setShowUserModal(false)}
                        onSuccess={() => {
                            fetchUsers();
                        }}
                    />
                )}
            </AnimatePresence>
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

function StatusBadge({ status }: { status: string }) {
    const isActive = status === "ACTIVE";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            isActive
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-gray-50 text-gray-400 border border-gray-100"
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-gray-300"}`} />
            {status}
        </span>
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

import React from "react";

const ActionMenu = React.forwardRef<HTMLDivElement, {
    userId: string;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onReset: () => void;
}>(({ userId, activeId, setActiveId, onView, onEdit, onDelete, onReset }, ref) => {
    const isOpen = activeId === userId;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.right - 192, // 192 is the width (w-48)
            });
        }
    }, [isOpen]);

    return (
        <div className="relative inline-flex" ref={ref}>
            <button
                ref={buttonRef}
                onClick={() => setActiveId(isOpen ? null : userId)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1C1C1A]/20 hover:text-[#1C1C1A] hover:bg-white transition-all ml-auto"
            >
                <MoreHorizontal size={16} />
            </button>
            {isOpen && typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            top: coords.top + 8,
                            left: coords.left,
                            width: "192px",
                            zIndex: 9999,
                        }}
                        className="bg-white rounded-2xl border border-[#1C1C1A]/10 shadow-2xl shadow-[#1C1C1A]/10 overflow-hidden"
                        data-action-menu="true"
                    >
                        <button onClick={() => { onView(); setActiveId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C1A]/60 hover:bg-[#1C1C1A]/[0.03] hover:text-[#1C1C1A] transition-colors">
                            <Eye size={14} /> View Profile
                        </button>
                        <button onClick={() => { onEdit(); setActiveId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1C1C1A]/60 hover:bg-[#1C1C1A]/[0.03] hover:text-[#1C1C1A] transition-colors">
                            <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={() => { onReset(); setActiveId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-amber-500 hover:bg-amber-50 transition-colors">
                            <KeyRound size={14} /> Reset Password
                        </button>
                        <div className="border-t border-[#1C1C1A]/5" />
                        <button onClick={() => { onDelete(); setActiveId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} /> Deactivate
                        </button>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
});

ActionMenu.displayName = "ActionMenu";
