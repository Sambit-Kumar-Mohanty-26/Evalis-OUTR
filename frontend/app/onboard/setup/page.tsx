"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Lock, Phone, Building2, GraduationCap, 
    CheckCircle2, ArrowRight, Loader2, Sparkles,
    ShieldAlert, ChevronRight, School, BookOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CustomSelect } from "@/components/ui/CustomSelect";

type Step = "password" | "profile" | "academic" | "final";

export default function OnboardSetupPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<Step>("password");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [currentPassword, setCurrentPassword] = useState("Evalis@2026");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    // Academic Metadata
    const [metadata, setMetadata] = useState<any>(null);
    const [selectedSchool, setSelectedSchool] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [currentSemester, setCurrentSemester] = useState("1");

    useEffect(() => {
        if (!user) router.push("/login");
        
        const fetchMetadata = async () => {
            try {
                const data = await api.get("/api/v1/academic/structure?versionId=current");
                setMetadata(data);
            } catch (err) {
                console.error("Failed to fetch academic context:", err);
            }
        };
        fetchMetadata();
    }, [user, router]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters for high-integrity security.");
            return;
        }
        setError(null);
        setStep("profile");
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post("/api/v1/profile/setup", {
                currentPassword,
                newPassword,
                phoneNumber,
                schoolId: selectedSchool,
                branchId: selectedBranch,
                rollNumber,
                currentSemester
            });
            setStep("final");
        } catch (err: any) {
            setError(err.message || "Failed to synchronize profile details.");
        } finally {
            setIsLoading(false);
        }
    };

    const allSchools = metadata?.programs?.flatMap((p: any) => p.schools) || [];
    // Deduplicate by normalized name (lowercase and trimmed)
    const schools = Array.from(
        allSchools.reduce((map: Map<string, any>, school: any) => {
            const normalizedName = school.name.toLowerCase().trim().replace(/sciences$/, 'science').replace(/s$/, '');
            if (!map.has(normalizedName)) {
                map.set(normalizedName, school);
            }
            return map;
        }, new Map<string, any>()).values()
    ) as any[];
    const branches = schools.find((s: any) => s.id === selectedSchool)?.branches || [];

    return (
        <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-green/5 blur-[120px] rounded-full -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full -ml-64 -mb-64" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-white/70 backdrop-blur-3xl rounded-[48px] border border-white shadow-2xl overflow-hidden relative z-10"
            >
                {/* Progress Header */}
                <div className="px-12 pt-12 flex items-center gap-2">
                    {["password", "profile", "academic", "final"].map((s, idx) => (
                        <React.Fragment key={s}>
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                step === s ? "w-8 bg-brand-green" : 
                                ["password", "profile", "academic", "final"].indexOf(step) > idx ? "w-4 bg-brand-green/30" : "w-4 bg-[#1C1C1A]/5"
                            }`} />
                            {idx < 3 && <div className="w-1 h-1 rounded-full bg-[#1C1C1A]/10" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="p-12">
                    <AnimatePresence mode="wait">
                        {step === "password" && (
                            <motion.div
                                key="password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-4">
                                        <Lock size={24} />
                                    </div>
                                    <h2 className="text-3xl font-serif text-[#1C1C1A]">Set Your Password</h2>
                                    <p className="text-sm text-[#1C1C1A]/40 font-medium">To keep your account secure, please replace the default password with a new one.</p>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">New Password</label>
                                            <input 
                                                required
                                                type="password" 
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-6 py-4 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Confirm New Password</label>
                                            <input 
                                                required
                                                type="password" 
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-6 py-4 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 text-red-600 text-xs font-bold">
                                            <ShieldAlert size={16} />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                                    >
                                        Proceed to Profile
                                        <ChevronRight size={20} />
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === "profile" && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4">
                                        <Phone size={24} />
                                    </div>
                                    <h2 className="text-3xl font-serif text-[#1C1C1A]">Contact Details</h2>
                                    <p className="text-sm text-[#1C1C1A]/40 font-medium">Provide your mobile number for important updates and secure notifications.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Mobile Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 group-focus-within:text-brand-green transition-colors" size={20} />
                                            <input 
                                                required
                                                type="tel" 
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="+91 98765 43210"
                                                className="w-full pl-12 pr-6 py-4 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep("academic")}
                                        disabled={!phoneNumber}
                                        className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        Proceed to School Details
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === "academic" && (
                            <motion.div
                                key="academic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-4">
                                        <Building2 size={24} />
                                    </div>
                                    <h2 className="text-3xl font-serif text-[#1C1C1A]">School Details</h2>
                                    <p className="text-sm text-[#1C1C1A]/40 font-medium">Select the school and department you belong to.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Select School</label>
                                            <CustomSelect 
                                                value={selectedSchool}
                                                onChange={setSelectedSchool}
                                                options={schools.map((s: any) => ({ value: s.id, label: s.name }))}
                                            />
                                        </div>

                                        {(user?.role !== "HEAD_OF_SCHOOL") && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Select Branch / Department</label>
                                                <CustomSelect 
                                                    value={selectedBranch}
                                                    onChange={setSelectedBranch}
                                                    options={branches.map((b: any) => ({ value: b.id, label: b.name }))}
                                                    disabled={!selectedSchool}
                                                />
                                            </div>
                                        )}

                                        {user?.role === "STUDENT" && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Regd. Number</label>
                                                    <input 
                                                        type="text" 
                                                        value={rollNumber}
                                                        onChange={(e) => setRollNumber(e.target.value)}
                                                        placeholder="2024BTCS001"
                                                        className="w-full px-4 py-3 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-xl text-sm font-semibold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Current Sem</label>
                                                    <input 
                                                        type="number" 
                                                        value={currentSemester}
                                                        onChange={(e) => setCurrentSemester(e.target.value)}
                                                        className="w-full px-4 py-3 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-xl text-sm font-semibold"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                                    <button
                                        onClick={handleFinalSubmit}
                                        disabled={isLoading || !selectedSchool || (user?.role !== "HEAD_OF_SCHOOL" && !selectedBranch)}
                                        className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                        Finalize Onboarding
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === "final" && (
                            <motion.div
                                key="final"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8"
                            >
                                <div className="w-24 h-24 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mx-auto mb-6">
                                    <CheckCircle2 size={48} className="animate-bounce" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-serif text-[#1C1C1A]">Account Setup Complete</h3>
                                    <p className="text-sm text-[#1C1C1A]/40 font-medium">Your account is now ready to use.</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4">
                                    {[
                                        { label: "Password", icon: Lock, val: "Set" },
                                        { label: "Phone", icon: Phone, val: "Linked" },
                                        { label: "School", icon: Building2, val: "Linked" }
                                    ].map((item) => (
                                        <div key={item.label} className="p-4 rounded-3xl bg-white border border-[#1C1C1A]/5 space-y-1">
                                            <item.icon size={16} className="text-brand-green mx-auto mb-2" />
                                            <p className="text-[8px] font-black uppercase tracking-widest text-[#1C1C1A]/30">{item.label}</p>
                                            <p className="text-[10px] font-bold text-[#1C1C1A]">{item.val}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        // Update local user state or just logout to force fresh token
                                        logout();
                                        router.push("/login?message=Onboarding successful. Please login with your new credentials.");
                                    }}
                                    className="w-full py-4 bg-brand-green text-white rounded-2xl text-sm font-bold shadow-xl shadow-brand-green/10 hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                                >
                                    Enter Dashboard
                                    <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
