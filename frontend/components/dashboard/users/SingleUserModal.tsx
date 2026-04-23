"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
    X, User, Mail, Phone, Shield, Calendar, BookOpen, 
    Edit3, Save, Loader2, Hash, MapPin, BadgeCheck, XCircle, Building2, GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface UserDetails {
    id: string;
    fullName: string;
    email: string;
    role: "STUDENT" | "TEACHER" | "ADMIN" | "INSTITUTE_ADMIN" | "HEAD_OF_SCHOOL" | "ADVISOR";
    status: "ACTIVE" | "INACTIVE";
    phoneNumber?: string;
    rollNumber?: string;
    currentSemester?: number;
    managedNodes?: { id: string; name: string; type: string; level: number }[];
    taughtSubjects?: { id: string; name: string; code: string }[];
    batch?: any;
    metadata?: any;
    createdAt?: string;
}

interface SingleUserModalProps {
    userId: string;
    mode: "view" | "edit";
    metadata: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SingleUserModal({ userId, mode: initialMode, metadata, onClose, onSuccess }: SingleUserModalProps) {
    const [mode, setMode] = useState(initialMode);
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
    const [rollNumber, setRollNumber] = useState("");
    const [currentSemester, setCurrentSemester] = useState<string>("");
    const [managedNodeIds, setManagedNodeIds] = useState<string[]>([]);
    const [selectedSchoolName, setSelectedSchoolName] = useState("");
    const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);
    const [selectedAdvisorBranch, setSelectedAdvisorBranch] = useState("");
    const [role, setRole] = useState<UserDetails["role"]>("STUDENT");

    useEffect(() => {
        fetchUser();
    }, [userId]);

    const fetchUser = async () => {
        setIsLoading(true);
        try {
            const data = await api.get(`/api/v1/user/${userId}`);
            setUser(data);
            // Sync form state
            setFullName(data.fullName);
            setEmail(data.email);
            setPhoneNumber(data.phoneNumber || "");
            setStatus(data.status);
            setRollNumber(data.rollNumber || "");
            setCurrentSemester(data.currentSemester?.toString() || "");
            setManagedNodeIds(data.managedNodes?.map((n: any) => n.id) || []);
            setRole(data.role);
            
            // Set name-based state for unique dropdowns
            const schoolNodes = data.managedNodes?.filter((n: any) => n.level === 2 || n.type === "SCHOOL") || [];
            const deptNodes = data.managedNodes?.filter((n: any) => n.level === 3 || n.type === "BRANCH" || n.type === "DEPARTMENT") || [];
            
            if (schoolNodes.length > 0) setSelectedSchoolName(schoolNodes[0].name);
            const deptNames: string[] = Array.from(new Set(deptNodes.map((n: any) => n.name as string)));
            setSelectedDeptNames(deptNames);
            
            // For advisor, determine the primary branch from metadata
            if (data.role === "ADVISOR") {
                const primaryId = data.metadata?.primaryAdvisorNodeId;
                if (primaryId) {
                    const primaryNode = data.managedNodes?.find((n: any) => n.id === primaryId);
                    if (primaryNode) setSelectedAdvisorBranch(primaryNode.name);
                } else if (deptNames.length > 0) {
                    setSelectedAdvisorBranch(deptNames[0]);
                }
            }
        } catch (error) {
            toast.error("Failed to load user profile");
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Resolve names back to ALL matching IDs (for B.Tech, M.Tech etc.)
            const finalNodeIds: string[] = [];
            if (selectedSchoolName) {
                const normalizedSearch = selectedSchoolName.trim().toLowerCase().replace(/s$/, "");
                const matches = metadata.orgNodes.filter((n: any) => {
                    const normalizedNode = n.name.trim().toLowerCase().replace(/s$/, "");
                    return normalizedNode === normalizedSearch && (n.level === 2 || n.type === "SCHOOL");
                });
                finalNodeIds.push(...matches.map((m: any) => m.id));
            }

            // Logical Assignment based on Role
            if (role === "ADVISOR") {
                // For Advisor, only the SPECIFIC advisor branch is managed
                if (selectedAdvisorBranch) {
                    const normalizedSearch = selectedAdvisorBranch.trim().toLowerCase().replace(/s$/, "");
                    const matches = metadata.orgNodes.filter((n: any) => {
                        const normalizedNode = n.name.trim().toLowerCase().replace(/s$/, "");
                        return normalizedNode === normalizedSearch && (n.level === 3 || n.type === "BRANCH" || n.type === "DEPARTMENT");
                    });
                    finalNodeIds.push(...matches.map((m: any) => m.id));
                }
            } else if (role !== "HEAD_OF_SCHOOL" && selectedDeptNames.length > 0) {
                // For regular Teachers, all selected departments are managed/linked
                selectedDeptNames.forEach(deptName => {
                    const normalizedSearch = deptName.trim().toLowerCase().replace(/s$/, "");
                    const matches = metadata.orgNodes.filter((n: any) => {
                        const normalizedNode = n.name.trim().toLowerCase().replace(/s$/, "");
                        return normalizedNode === normalizedSearch && (n.level === 3 || n.type === "BRANCH" || n.type === "DEPARTMENT");
                    });
                    finalNodeIds.push(...matches.map((m: any) => m.id));
                });
            }

            // Resolve the Primary Advisor ID if applicable
            let primaryAdvisorId = null;
            if (role === "ADVISOR" && selectedAdvisorBranch) {
                const normalizedSearch = selectedAdvisorBranch.trim().toLowerCase().replace(/s$/, "");
                const match = metadata.orgNodes.find((n: any) => {
                    const normalizedNode = n.name.trim().toLowerCase().replace(/s$/, "");
                    return normalizedNode === normalizedSearch && (n.level === 3 || n.type === "BRANCH");
                });
                primaryAdvisorId = match?.id;
            }

            await api.put(`/api/v1/user/${userId}`, {
                fullName,
                email,
                phoneNumber: phoneNumber || null,
                status,
                role,
                rollNumber: rollNumber || null,
                currentSemester: currentSemester ? parseInt(currentSemester) : null,
                managedNodeIds: finalNodeIds,
                metadata: {
                    ...user?.metadata,
                    primaryAdvisorNodeId: primaryAdvisorId
                }
            });
            toast.success("User updated successfully");
            onSuccess();
            setMode("view");
            fetchUser();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update user");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1A]/20 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                    <p className="text-sm font-medium text-[#1C1C1A]/60">Syncing user data...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const isStudent = user.role === "STUDENT";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-[#1C1C1A]/40 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[#1C1C1A]/5"
            >
                {/* Header Section */}
                <div className="relative h-24 bg-gradient-to-br from-[#1C1C1A] to-[#2C2C2A] px-8 flex items-center justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-green/10 rounded-full blur-3xl -mr-24 -mt-24" />
                    
                    <div className="z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-0.5">
                            {mode === "edit" ? (
                                <input 
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-1 text-2xl font-bold text-white outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                                    placeholder="Full Name"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-white tracking-tight">{user.fullName}</h2>
                            )}
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                    role === "ADMIN" ? "bg-red-500/20 border-red-500/30 text-red-500" :
                                    role === "HEAD_OF_SCHOOL" ? "bg-purple-500/20 border-purple-500/30 text-purple-500" :
                                    role === "ADVISOR" ? "bg-blue-500/20 border-blue-500/30 text-blue-500" :
                                    role === "TEACHER" ? "bg-brand-green/20 border-brand-green/30 text-brand-green" :
                                    "bg-neutral-500/20 border-neutral-500/30 text-neutral-400"
                                }`}>
                                    {role.replace(/_/g, " ")}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                    status === "ACTIVE" 
                                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                        : "bg-red-500/20 border-red-500/30 text-red-400"
                                }`}>
                                    {status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                    
                    {mode === "view" && (
                        <button 
                            onClick={() => setMode("edit")}
                            className="bg-brand-green text-white px-5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-brand-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Edit3 size={14} /> Edit Profile
                        </button>
                    )}
                </div>

                <div className="px-8 py-5">
                    <div className="grid grid-cols-12 gap-8">
                        {/* LEFT: Contact & Core */}
                        <div className="col-span-5 space-y-5">
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-[0.2em] px-1">Identity & Contact</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1C1C1A]/[0.02] border border-[#1C1C1A]/[0.03]">
                                        <Mail className="w-4 h-4 text-brand-green" />
                                        <div className="space-y-0.5 flex-1">
                                            <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase">Email Address</p>
                                            {mode === "edit" ? (
                                                <input 
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="w-full bg-transparent text-sm font-semibold text-[#1C1C1A] border-b border-[#1C1C1A]/10 outline-none focus:border-brand-green transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-[#1C1C1A]/80">{user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1C1C1A]/[0.02] border border-[#1C1C1A]/[0.03]">
                                        <Phone className="w-4 h-4 text-brand-green" />
                                        <div className="space-y-0.5 flex-1">
                                            <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase">Phone Number</p>
                                            {mode === "edit" ? (
                                                <input 
                                                    value={phoneNumber}
                                                    onChange={e => setPhoneNumber(e.target.value)}
                                                    className="w-full bg-transparent text-sm font-semibold text-[#1C1C1A] border-b border-[#1C1C1A]/10 outline-none focus:border-brand-green transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm font-semibold text-[#1C1C1A]/80">{user.phoneNumber || "- No phone provided -"}</p>
                                            )}
                                        </div>
                                    </div>
                                    {mode === "edit" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <CustomSelect 
                                                label="Status"
                                                value={status}
                                                onChange={(val) => setStatus(val as any)}
                                                options={[
                                                    { value: "ACTIVE", label: "Active" },
                                                    { value: "INACTIVE", label: "Inactive" }
                                                ]}
                                                compact
                                            />
                                            <CustomSelect 
                                                label="System Role"
                                                value={role}
                                                onChange={(val) => setRole(val as any)}
                                                options={[
                                                    { value: "TEACHER", label: "Teacher" },
                                                    { value: "HEAD_OF_SCHOOL", label: "Head of School" },
                                                    { value: "ADVISOR", label: "Dept Advisor" },
                                                    { value: "ADMIN", label: "System Admin" }
                                                ]}
                                                compact
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-[0.2em] px-1">System Metadata</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-2xl bg-[#1C1C1A]/[0.02] border border-dashed border-[#1C1C1A]/10">
                                        <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase mb-1">Created</p>
                                        <p className="text-xs font-semibold text-[#1C1C1A]/60 flex items-center gap-2">
                                            <Calendar size={12} /> {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[#1C1C1A]/[0.02] border border-dashed border-[#1C1C1A]/10">
                                        <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase mb-1">ID Ref</p>
                                        <p className="text-xs font-mono font-semibold text-[#1C1C1A]/40 truncate">{user.id.slice(0, 12)}...</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: Academic & Roles */}
                        <div className="col-span-7 space-y-5">
                            {isStudent ? (
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-[0.2em] px-1">Academic Records</h3>
                                    <div className="p-6 rounded-[24px] bg-[#1C1C1A]/[0.02] border border-[#1C1C1A]/[0.05] space-y-6">
                                        <div className="flex items-center gap-4">
                                            <Hash className="w-5 h-5 text-brand-green" />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase">Roll Number</p>
                                                {mode === "edit" ? (
                                                    <input 
                                                        value={rollNumber}
                                                        onChange={e => setRollNumber(e.target.value)}
                                                        className="w-full bg-transparent text-sm font-semibold text-[#1C1C1A] border-b border-[#1C1C1A]/10 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-bold text-[#1C1C1A]">{user.rollNumber || "NOT ASSIGNED"}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <BookOpen className="w-5 h-5 text-brand-green" />
                                            <div>
                                                <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase">Semester</p>
                                                {mode === "edit" ? (
                                                    <input 
                                                        type="number"
                                                        value={currentSemester}
                                                        onChange={e => setCurrentSemester(e.target.value)}
                                                        className="w-16 bg-transparent text-sm font-bold text-[#1C1C1A] border-b border-[#1C1C1A]/10 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-bold text-[#1C1C1A]">{user.currentSemester || 1}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 pt-4 border-t border-[#1C1C1A]/5">
                                            <MapPin className="w-5 h-5 text-brand-green mt-1" />
                                            <div>
                                                <p className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase">Assigned Path</p>
                                                <p className="text-sm font-semibold text-[#1C1C1A]/80 leading-relaxed">
                                                    {user.batch?.branch?.school?.program?.name || '-'} / {user.batch?.branch?.school?.name || '-'}
                                                </p>
                                                <p className="text-xs font-bold text-[#1C1C1A]/40 mt-1 uppercase tracking-wider">{user.batch?.name || 'No Batch'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            ) : (
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-[0.2em] px-1">Managed Nodes & Access</h3>
                                    <div className="space-y-2">
                                        {mode === "edit" ? (
                                            <div className="space-y-4 p-5 rounded-[24px] bg-[#1C1C1A]/[0.02] border border-[#1C1C1A]/[0.05]">
                                                <div className="space-y-3">
                                                    {/* School Selection */}
                                                    <CustomSelect 
                                                        label="School / Faculty"
                                                        value={selectedSchoolName}
                                                        onChange={(val) => {
                                                            setSelectedSchoolName(val);
                                                            setSelectedDeptNames([]);
                                                        }}
                                                        options={(() => {
                                                            const schools = metadata.orgNodes?.filter((n: any) => n.level === 2 || n.type === "SCHOOL") || [];
                                                            const seen = new Set();
                                                            return schools
                                                                .filter((n: any) => {
                                                                    const normalized = n.name.trim().toLowerCase().replace(/s$/, "");
                                                                    if (seen.has(normalized)) return false;
                                                                    seen.add(normalized);
                                                                    return true;
                                                                })
                                                                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                                                                .map((n: any) => ({ value: n.name, label: n.name }));
                                                        })()}
                                                        compact
                                                    />

                                                    {/* Department Selection - Only shown if not HOS or if specified */}
                                                    {role !== "HEAD_OF_SCHOOL" && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between px-1">
                                                                <p className="text-[10px] font-bold text-[#1C1C1A]/20 uppercase">Departments / Branches</p>
                                                                {role === "ADVISOR" && selectedDeptNames.length > 1 && (
                                                                    <span className="text-[10px] font-bold text-blue-500/60 uppercase">Multiple Advisor Assignment</span>
                                                                )}
                                                            </div>
                                                            <CustomSelect 
                                                                placeholder={role === "ADVISOR" ? "+ Assign Advisor Branch" : "+ Add Department"}
                                                                value=""
                                                                onChange={(val) => {
                                                                    if (val && !selectedDeptNames.includes(val)) {
                                                                        setSelectedDeptNames([...selectedDeptNames, val]);
                                                                    }
                                                                }}
                                                                options={(() => {
                                                                    const depts = metadata.orgNodes?.filter((n: any) => {
                                                                        const isDept = n.level === 3 || n.type === "BRANCH" || n.type === "DEPARTMENT";
                                                                        if (!isDept) return false;
                                                                        if (!selectedSchoolName) return true;
                                                                        const parent = metadata.orgNodes.find((p: any) => p.id === n.parentId);
                                                                        const normParent = parent?.name.trim().toLowerCase().replace(/s$/, "");
                                                                        const normSearch = selectedSchoolName.trim().toLowerCase().replace(/s$/, "");
                                                                        return normParent === normSearch;
                                                                    }) || [];
                                                                    const seen = new Set();
                                                                    return depts
                                                                        .filter((n: any) => {
                                                                            const normalized = n.name.trim().toLowerCase().replace(/s$/, "");
                                                                            if (seen.has(normalized)) return false;
                                                                            seen.add(normalized);
                                                                            return true;
                                                                        })
                                                                        .filter((n: any) => !selectedDeptNames.includes(n.name))
                                                                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                                                                        .map((n: any) => ({ value: n.name, label: n.name }));
                                                                })()}
                                                                compact
                                                            />

                                                            {/* Selected Dept Tags */}
                                                            {selectedDeptNames.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {selectedDeptNames.map(name => (
                                                                        <button
                                                                            key={name}
                                                                            onClick={() => {
                                                                                setSelectedDeptNames(selectedDeptNames.filter(n => n !== name));
                                                                                if (selectedAdvisorBranch === name) setSelectedAdvisorBranch("");
                                                                            }}
                                                                            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-green/5 hover:bg-red-50 text-brand-green hover:text-red-500 border border-brand-green/10 transition-all"
                                                                        >
                                                                            <span className="text-xs font-bold">{name}</span>
                                                                            <X size={12} className="opacity-40 group-hover:opacity-100" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Primary Advisor Selection for Multiple Branches */}
                                                    {role === "ADVISOR" && selectedDeptNames.length > 1 && (
                                                        <div className="pt-2 border-t border-[#1C1C1A]/5">
                                                            <CustomSelect 
                                                                label="Primary Advisor Role At"
                                                                placeholder="Which branch advisor?"
                                                                value={selectedAdvisorBranch}
                                                                onChange={setSelectedAdvisorBranch}
                                                                options={selectedDeptNames.map(n => ({ value: n, label: n }))}
                                                                compact
                                                                error={!selectedAdvisorBranch ? "Required for Advisor role" : ""}
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    {role === "ADVISOR" && selectedDeptNames.length === 1 && (
                                                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
                                                            <BadgeCheck size={16} className="text-blue-500" />
                                                            <p className="text-[10px] font-bold text-blue-600 uppercase">Advisor Role: {selectedDeptNames[0]}</p>
                                                        </div>
                                                    )}

                                                    {role === "HEAD_OF_SCHOOL" && (
                                                        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-3">
                                                            <Building2 size={16} className="text-purple-500" />
                                                            <p className="text-[10px] font-bold text-purple-600 uppercase">Institutional Control: Entire School Faculty</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : user.managedNodes && user.managedNodes.length > 0 ? (
                                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(() => {
                                                    const seen = new Set();
                                                    return user.managedNodes
                                                        .filter(node => {
                                                            const normalized = node.name.trim().toLowerCase().replace(/s$/, "");
                                                            if (seen.has(normalized)) return false;
                                                            seen.add(normalized);
                                                            return true;
                                                        })
                                                        .map(node => {
                                                            const isPrimaryAdvisor = role === "ADVISOR" && user.metadata?.primaryAdvisorNodeId === node.id;
                                                            const isHOS = role === "HEAD_OF_SCHOOL" && (node.level === 2 || node.type === "SCHOOL");
                                                            
                                                            return (
                                                                <div key={node.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                                    isPrimaryAdvisor ? "bg-blue-500/5 border-blue-500/20" : 
                                                                    isHOS ? "bg-purple-500/5 border-purple-500/20" :
                                                                    "bg-brand-green/[0.03] border-brand-green/10"
                                                                }`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <MapPin size={16} className={isPrimaryAdvisor ? "text-blue-500" : isHOS ? "text-purple-500" : "text-brand-green"} />
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-sm font-semibold text-[#1C1C1A]/80">{node.name}</span>
                                                                            {(isPrimaryAdvisor || isHOS) && (
                                                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${
                                                                                    isPrimaryAdvisor ? "text-blue-600" : "text-purple-600"
                                                                                }`}>
                                                                                    {isPrimaryAdvisor ? "ADMINISTRATIVE ADVISOR" : "INSTITUTIONAL HEAD"}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                                        isPrimaryAdvisor ? "text-blue-500" : isHOS ? "text-purple-500" : "text-brand-green"
                                                                    }`}>{node.type}</span>
                                                                </div>
                                                            );
                                                        });
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl border border-dashed border-[#1C1C1A]/10 flex flex-col items-center justify-center gap-1 opacity-40">
                                                <XCircle size={20} />
                                                <p className="text-xs font-medium">No nodes assigned</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase tracking-[0.2em] px-1 pt-4">Subject Assignments</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.taughtSubjects && user.taughtSubjects.length > 0 ? (
                                            user.taughtSubjects.map(sub => (
                                                <span key={sub.id} className="px-3 py-1.5 rounded-xl bg-[#1C1C1A]/[0.03] border border-[#1C1C1A]/5 text-xs font-medium text-[#1C1C1A]/60">
                                                    {sub.name} <span className="opacity-40 ml-1">[{sub.code}]</span>
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-xs text-[#1C1C1A]/30 italic px-1">No subjects mapped yet.</p>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-4 border-t border-[#1C1C1A]/5 flex items-center justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#1C1C1A]/40 hover:text-[#1C1C1A] hover:bg-[#1C1C1A]/5 transition-all"
                        >
                            Cancel
                        </button>
                        {mode === "edit" ? (
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#1C1C1A] text-white px-8 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-[#1C1C1A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                                Save Changes
                            </button>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="bg-[#1C1C1A] text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#1C1C1A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Close Profile
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
