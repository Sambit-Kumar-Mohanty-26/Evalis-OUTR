"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ShieldCheck, User, ArrowRight, Loader2, CheckCircle2, Building2, GraduationCap, Users, UserCog } from "lucide-react";
import { api } from "@/lib/api";
import { EvalisLogo } from "@/components/ui/EvalisLogo";

const roleConfig: Record<string, any> = {
    head_of_school: { name: "Head of Schools", icon: Building2, color: "text-purple-500", bg: "bg-purple-50" },
    advisor: { name: "Academic Advisor", icon: UserCog, color: "text-blue-500", bg: "bg-blue-50" },
    teacher: { name: "Faculty Member", icon: Users, color: "text-brand-green", bg: "bg-brand-green/5" },
    student: { name: "Student", icon: GraduationCap, color: "text-orange-500", bg: "bg-orange-50" }
};

type Step = "email" | "otp" | "name" | "success";

export default function JoinRolePage() {
    const { role } = useParams() as { role: string };
    const searchParams = useSearchParams();
    const router = useRouter();
    const tenantId = searchParams.get("tenantId");

    const config = roleConfig[role] || roleConfig.student;

    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [fullName, setFullName] = useState("");
    const [preAuthToken, setPreAuthToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) {
            setError("Institutional context is missing. Please re-scan the QR code.");
        }
    }, [tenantId]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await api.post("/api/v1/auth/send-otp", { email });
            setStep("otp");
        } catch (err: any) {
            setError(err.message || "Failed to transmit verification signal.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.post("/api/v1/auth/verify-otp", { email, otp });
            setPreAuthToken(data.preAuthToken);
            setStep("name");
        } catch (err: any) {
            setError(err.message || "Invalid verification sequence.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await api.post("/api/v1/auth/qr-register", {
                fullName,
                email,
                role: role.toUpperCase(),
                tenantId,
                preAuthToken
            });
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Identity synthesis failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (error && !tenantId) {
        return (
            <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[40px] p-10 border border-red-100 shadow-2xl text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-serif text-[#1C1C1A]">Context Error</h2>
                    <p className="text-sm text-[#1C1C1A]/60">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Aesthetics */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/5 blur-[120px] rounded-full -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -ml-48 -mb-48" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full bg-white/80 backdrop-blur-2xl rounded-[48px] border border-white shadow-2xl overflow-hidden relative z-10"
            >
                {/* Branding & Role Header */}
                <div className="p-12 pb-6 flex flex-col items-center text-center space-y-6">
                    <EvalisLogo className="scale-110" />
                    <div className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg} border border-[#1C1C1A]/5 ${config.color}`}>
                            <config.icon size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{config.name} Portal</span>
                        </div>
                        <h2 className="text-3xl font-serif text-[#1C1C1A]">Synthesize Your Identity</h2>
                        <p className="text-sm text-[#1C1C1A]/40 font-medium">Join your institutional grid to begin the academic journey.</p>
                    </div>
                </div>

                <div className="px-12 pb-12">
                    <AnimatePresence mode="wait">
                        {step === "email" && (
                            <motion.form
                                key="email"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendOtp}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Institutional Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 group-focus-within:text-brand-green transition-colors" size={20} />
                                        <input 
                                            required
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@institution.edu.in"
                                            className="w-full pl-12 pr-6 py-4 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold"
                                        />
                                    </div>
                                </div>
                                {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
                                <button
                                    disabled={isLoading || !email}
                                    className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                                    Verify Email
                                </button>
                            </motion.form>
                        )}

                        {step === "otp" && (
                            <motion.form
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-6"
                            >
                                <div className="space-y-2 text-center">
                                    <p className="text-xs text-[#1C1C1A]/40 font-medium">A verification signal has been sent to</p>
                                    <p className="text-sm font-bold text-[#1C1C1A]">{email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Verification OTP</label>
                                    <input 
                                        required
                                        type="text" 
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="000000"
                                        className="w-full px-6 py-4 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-2xl text-center text-2xl tracking-[0.5em] font-serif text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all"
                                    />
                                </div>
                                {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                                <button
                                    disabled={isLoading || otp.length < 6}
                                    className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                                    Proceed
                                </button>
                                <button type="button" onClick={() => setStep("email")} className="w-full text-[10px] font-black text-[#1C1C1A]/30 uppercase tracking-[0.2em] hover:text-brand-green transition-colors">
                                    Change Email Address
                                </button>
                            </motion.form>
                        )}

                        {step === "name" && (
                            <motion.form
                                key="name"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleRegister}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#1C1C1A]/40 uppercase tracking-[0.2em] px-1">Legal Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 group-focus-within:text-brand-green transition-colors" size={20} />
                                        <input 
                                            required
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Dr. Alexander Wright"
                                            className="w-full pl-12 pr-6 py-4 bg-[#F8F7F2]/50 border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/15 focus:outline-none focus:bg-white focus:border-brand-green/20 focus:shadow-sm transition-all font-semibold"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/10 flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0 mt-0.5">
                                        <ShieldCheck size={14} />
                                    </div>
                                    <p className="text-[10px] text-[#1C1C1A]/60 font-medium leading-relaxed">
                                        Your account will be initialized with a default password. You will be required to calibrate your credentials upon first entry.
                                    </p>
                                </div>
                                {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
                                <button
                                    disabled={isLoading || !fullName}
                                    className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                    Synthesize Identity
                                </button>
                            </motion.form>
                        )}

                        {step === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-8"
                            >
                                <div className="w-24 h-24 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mx-auto mb-6">
                                    <CheckCircle2 size={48} className="animate-bounce" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-serif text-[#1C1C1A]">Identity Stabilized</h3>
                                    <p className="text-sm text-[#1C1C1A]/40 font-medium">Your institutional profile has been successfully generated.</p>
                                </div>
                                
                                <div className="p-6 rounded-[32px] bg-[#F8F7F2] border border-[#1C1C1A]/5 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-[#1C1C1A]/20 uppercase tracking-[0.2em]">Default Credentials</p>
                                        <p className="text-lg font-serif text-[#1C1C1A]">{email}</p>
                                    </div>
                                    <div className="py-2 px-4 bg-white rounded-xl inline-block border border-[#1C1C1A]/5">
                                        <p className="text-xs font-bold text-[#1C1C1A]">Password: <span className="font-mono text-brand-green">Evalis@2026</span></p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full py-4 bg-[#1C1C1A] text-white rounded-2xl text-sm font-bold shadow-xl shadow-[#1C1C1A]/10 hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                                >
                                    Login to Interface
                                    <ArrowRight size={20} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Link */}
                <div className="p-8 border-t border-[#1C1C1A]/5 text-center">
                    <p className="text-[10px] text-[#1C1C1A]/30 font-black uppercase tracking-[0.2em]">Evalis Core Institutional Grid</p>
                </div>
            </motion.div>
        </div>
    );
}
