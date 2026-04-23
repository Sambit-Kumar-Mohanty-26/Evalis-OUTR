"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, RefreshCw, Loader2, Sparkles, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { cn } from "@/lib/utils";

interface Metadata {
    orgNodes: { id: string; name: string; type: string; level: number; parentId: string | null }[];
    programs: { id: string; name: string }[];
    schools: { id: string; name: string; programId: string; orgNodeId: string }[];
    branches: { id: string; name: string; schoolId: string; orgNodeId: string }[];
    batches: { id: string; name: string; branchId: string }[];
    subjects: { id: string; name: string; code: string; semesterId: string }[];
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    activeTab: "teachers" | "students" | "admin";
}

const SectionLabel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h3 className={cn("text-[11px] font-extrabold text-[#1C1C1A]/40 uppercase tracking-[0.15em] mb-4 flex items-center gap-3", className)}>
        {children}
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#1C1C1A]/5 to-transparent" />
    </h3>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-extrabold text-[#1C1C1A]/60 uppercase tracking-wider px-1">
            {label}
        </label>
        {children}
    </div>
);

export default function AddUserModal({ isOpen, onClose, onSuccess, activeTab }: AddUserModalProps) {
    const isStudent = activeTab === "students";
    const [metadata, setMetadata] = useState<Metadata>({
        orgNodes: [], programs: [], schools: [], branches: [], batches: [], subjects: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    
    // Role/Placement State
    const [selectedRole, setSelectedRole] = useState(isStudent ? "STUDENT" : "TEACHER");
    const [selectedSchool, setSelectedSchool] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedBatch, setSelectedBatch] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [currentSemester, setCurrentSemester] = useState("1");
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await api.get("/api/v1/user/metadata");
                setMetadata(res);
            } catch (err) {
                console.error("Failed to fetch metadata:", err);
            }
        };
        if (isOpen) fetchMetadata();
    }, [isOpen]);

    const filteredBranches = selectedSchool
        ? metadata.branches.filter(b => {
            const school = metadata.schools.find(s => s.id === b.schoolId);
            return school?.name === selectedSchool;
        })
        : metadata.branches;

    const filteredBatches = selectedBranch
        ? metadata.batches.filter(b => b.branchId === selectedBranch)
        : metadata.batches;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const body: any = {
                fullName,
                email,
                phoneNumber: phoneNumber || undefined,
                password: password || undefined,
                role: selectedRole,
            };

            if (isStudent) {
                body.role = "STUDENT";
                body.batchId = selectedBatch || undefined;
                body.rollNumber = rollNumber || undefined;
                body.currentSemester = parseInt(currentSemester) || 1;
            } else {
                const nodeIds: string[] = [];
                if (selectedRole === "HEAD_OF_SCHOOL") {
                    if (selectedSchool) {
                        const matchingSchools = metadata.schools.filter(s => s.name === selectedSchool);
                        matchingSchools.forEach(s => {
                            if (s.orgNodeId) nodeIds.push(s.orgNodeId);
                        });
                    }
                } else {
                    if (selectedSchool) {
                        const matchingSchools = metadata.schools.filter(s => s.name === selectedSchool);
                        matchingSchools.forEach(s => {
                            if (s.orgNodeId) nodeIds.push(s.orgNodeId);
                        });
                    }
                    if (selectedBranch) {
                        const branch = metadata.branches.find(b => b.id === selectedBranch);
                        if (branch?.orgNodeId) nodeIds.push(branch.orgNodeId);
                    }
                }
                
                if (nodeIds.length > 0) body.managedNodeIds = Array.from(new Set(nodeIds));
                
                if (selectedRole === "ADVISOR" && selectedBranch) {
                    const branch = metadata.branches.find(b => b.id === selectedBranch);
                    if (branch?.orgNodeId) {
                        body.metadata = { primaryAdvisorNodeId: branch.orgNodeId };
                    }
                }

                if (selectedSubjectIds.length > 0) body.subjectIds = selectedSubjectIds;
            }

            await api.post("/api/v1/user", body);
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to create user.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#1C1C1A]/20 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white overflow-hidden"
                    >
                        <div className="p-8 border-b border-[#1C1C1A]/5 flex items-center justify-between bg-white/40">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-brand-green/10 text-brand-green">
                                    <UserPlus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[#1C1C1A]">Add New {isStudent ? "Student" : "User"}</h2>
                                    <p className="text-xs text-[#1C1C1A]/40 font-medium">Create a single user record manually</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[#1C1C1A]/5 rounded-xl transition-colors text-[#1C1C1A]/30">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 py-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            <form id="add-user-form" onSubmit={handleSubmit} className="space-y-8">
                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <SectionLabel>Identity</SectionLabel>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <FormField label="Full Name *">
                                            <input 
                                                required
                                                type="text" 
                                                value={fullName} 
                                                onChange={e => setFullName(e.target.value)} 
                                                placeholder="John Doe" 
                                                className="w-full px-4 py-3 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold" 
                                            />
                                        </FormField>
                                        <FormField label="Email *">
                                            <input 
                                                required
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                placeholder="john@institution.edu" 
                                                className="w-full px-4 py-3 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold" 
                                            />
                                        </FormField>
                                        <FormField label="Phone Number">
                                            <input 
                                                type="text" 
                                                value={phoneNumber} 
                                                onChange={e => setPhoneNumber(e.target.value)} 
                                                placeholder="+91 98765 43210" 
                                                className="w-full px-4 py-3 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold" 
                                            />
                                        </FormField>
                                        {!isStudent && (
                                            <FormField label="Password">
                                                <input 
                                                    type="password" 
                                                    value={password} 
                                                    onChange={e => setPassword(e.target.value)} 
                                                    placeholder="Leave empty for default" 
                                                    className="w-full px-4 py-3 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold" 
                                                />
                                            </FormField>
                                        )}
                                    </div>
                                </div>

                                {!isStudent && (
                                    <div>
                                        <SectionLabel>Role Selection</SectionLabel>
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            {["TEACHER", "ADVISOR", "HEAD_OF_SCHOOL"].map(role => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRole(role);
                                                        if (role === "HEAD_OF_SCHOOL") setSelectedBranch("");
                                                    }}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-[11px] font-extrabold uppercase tracking-widest transition-all",
                                                        selectedRole === role 
                                                            ? "bg-[#1C1C1A] text-white border-[#1C1C1A]" 
                                                            : "bg-white border-[#1C1C1A]/5 text-[#1C1C1A]/40 hover:border-[#1C1C1A]/10"
                                                    )}
                                                >
                                                    {role.replace(/_/g, " ")}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isStudent && (
                                    <div>
                                        <SectionLabel>Academic Details</SectionLabel>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <FormField label="Roll Number">
                                                <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="2024BTCS001" className="w-full px-4 py-3 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold" />
                                            </FormField>
                                            <FormField label="Current Semester">
                                                <input type="number" value={currentSemester} onChange={e => setCurrentSemester(e.target.value)} placeholder="1" className="w-full px-4 py-3 bg-white/60 border border-[#1C1C1A]/5 rounded-xl text-sm text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold" />
                                            </FormField>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <SectionLabel>Institutional Placement</SectionLabel>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <FormField label="School / Faculty">
                                            <CustomSelect
                                                value={selectedSchool}
                                                onChange={setSelectedSchool}
                                                options={(() => {
                                                    const seen = new Set();
                                                    return metadata.schools.filter(s => {
                                                        const normalized = s.name.trim().toLowerCase();
                                                        if (seen.has(normalized)) return false;
                                                        seen.add(normalized);
                                                        return true;
                                                    }).map(s => ({ value: s.name, label: s.name }));
                                                })()}
                                                compact
                                            />
                                        </FormField>
                                        {selectedRole !== "HEAD_OF_SCHOOL" && (
                                            <FormField label={selectedRole === "ADVISOR" ? "Advisor Branch" : "Department / Branch"}>
                                                <CustomSelect
                                                    value={selectedBranch}
                                                    onChange={setSelectedBranch}
                                                    options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
                                                    compact
                                                />
                                            </FormField>
                                        )}
                                        {selectedRole === "HEAD_OF_SCHOOL" && (
                                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center gap-3">
                                                <Building2 className="text-purple-500" size={18} />
                                                <p className="text-[10px] font-bold text-purple-600/70 uppercase">Manages entire School</p>
                                            </div>
                                        )}
                                        {isStudent && (
                                            <div className="col-span-2">
                                                <FormField label="Specific Batch">
                                                    <CustomSelect
                                                        value={selectedBatch}
                                                        onChange={setSelectedBatch}
                                                        options={filteredBatches.map(b => ({ value: b.id, label: b.name }))}
                                                        compact
                                                    />
                                                </FormField>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!isStudent && metadata.subjects.length > 0 && (
                                    <div>
                                        <SectionLabel>Subject Assignment</SectionLabel>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {metadata.subjects
                                                .filter(s => !selectedBranch || s.semesterId.includes(selectedBranch))
                                                .map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSubjectIds(prev => 
                                                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "flex flex-col p-3 rounded-xl border text-left transition-all",
                                                        selectedSubjectIds.includes(s.id)
                                                            ? "bg-brand-green/10 border-brand-green/30"
                                                            : "bg-white border-[#1C1C1A]/5 hover:border-[#1C1C1A]/10"
                                                    )}
                                                >
                                                    <span className="text-[10px] font-bold text-[#1C1C1A]/30 uppercase mb-1">{s.code}</span>
                                                    <span className="text-xs font-semibold text-[#1C1C1A]/80">{s.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="px-8 py-5 border-t border-[#1C1C1A]/5 flex items-center justify-between bg-white/40">
                            <p className="text-[10px] text-[#1C1C1A]/30 font-medium">
                                Default Password: <span className="font-mono font-bold text-[#1C1C1A]/60">Evalis@2024</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-sm font-bold text-[#1C1C1A]/40 hover:text-[#1C1C1A]/60 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    form="add-user-form"
                                    type="submit"
                                    disabled={isSubmitting || !fullName || !email}
                                    className="px-8 py-2.5 bg-[#1C1C1A] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#1C1C1A]/10 hover:shadow-xl hover:shadow-[#1C1C1A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                    {isSubmitting ? "Creating..." : `Add ${isStudent ? "Student" : "User"}`}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
