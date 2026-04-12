"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { EvalisLogo } from "@/components/ui/EvalisLogo";
import { Button } from "@/components/ui/Button";
import { NeuralBackground } from "@/components/ui/NeuralBackground";
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardPage() {
    const { sendOtp, verifyOtp, onboard } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<"details" | "otp" | "success">("details");
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
    });
    const [otp, setOtp] = useState("");
    const [preAuthToken, setPreAuthToken] = useState("");
    
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await sendOtp(formData.email);
            setStep("otp");
        } catch (err: any) {
            setError(err.message || "Failed to initiate protocol. Check your network.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const token = await verifyOtp(formData.email, otp);
            setPreAuthToken(token);
            
            // Immediately trigger onboarding with the token
            await onboard({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phone,
                password: formData.password,
                preAuthToken: token
            });
            
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Invalid signature match.");
        } finally {
            setIsLoading(false);
        }
    };

    const splitText = (text: string) => {
        return text.split(" ").map((word, i) => (
            <span key={i} className="inline-block whitespace-nowrap overflow-hidden py-1">
                {word.split("").map((char, j) => (
                    <motion.span
                        key={`${i}-${j}`}
                        initial={{ y: "110%", rotateZ: 10 }}
                        animate={{ y: 0, rotateZ: 0 }}
                        transition={{
                            duration: 1,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.2 + (i * 0.1) + (j * 0.02)
                        }}
                        className="inline-block"
                    >
                        {char}
                    </motion.span>
                ))}
                {i < text.split(" ").length - 1 && "\u00A0"}
            </span>
        ));
    };

    return (
        <div className="min-h-screen bg-[#F4F2EB] flex overflow-hidden selection:bg-[#FFB3D9]/30">
            {/* Left Column: Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 bg-white/40 border-r border-[#1C1C1A]/5 overflow-hidden">
                <NeuralBackground />

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-12"
                    >
                        <EvalisLogo className="mb-8" />
                        <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1A] leading-[1.1] mb-6">
                            {splitText("Initialize your Institution's Intelligence.")}
                        </h2>
                        <p className="text-[#1C1C1A]/60 text-lg font-light leading-relaxed max-w-md">
                            Establish your administrative core. Securely architect your academic framework with Evalis Hyper-Standard protocols.
                        </p>
                    </motion.div>
                    <div className="flex flex-wrap gap-3">
                        {["Admin Core", "Global Standards", "Hyper-Security"].map((feature, i) => (
                            <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + (i * 0.1) }}
                                className="px-4 py-2 rounded-full border border-[#1C1C1A]/10 bg-white/50 backdrop-blur-sm text-xs font-sans text-[#1C1C1A]/70 flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                                {feature}
                            </motion.div>
                        ))}
                    </div>
                </div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-green/5 rounded-full blur-[100px]" />
                <div className="absolute top-20 right-20 w-64 h-64 bg-[#FFB3D9]/5 rounded-full blur-[100px]" />
            </div>

            {/* Right Column: Interaction */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto">
                <div className="lg:hidden absolute top-8 left-8">
                    <EvalisLogo />
                </div>

                <AnimatePresence mode="wait">
                    {step === "details" && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="w-full max-w-[400px] py-20 lg:py-0"
                        >
                            <div className="mb-10 text-center lg:text-left">
                                <h1 className="text-3xl font-serif text-[#1C1C1A] mb-2">
                                    {splitText("Initialize Admin")}
                                </h1>
                                <p className="text-[#1C1C1A]/50 font-sans text-sm">Please register your administrative credentials.</p>
                            </div>

                            <form onSubmit={handleDetailsSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30 group-focus-within:text-brand-green transition-colors">
                                            <User size={18} strokeWidth={1.5} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                            placeholder="John Doe"
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest">Institutional Email</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30 group-focus-within:text-brand-green transition-colors">
                                            <Mail size={18} strokeWidth={1.5} />
                                        </div>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            placeholder="admin@university.edu"
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest">Phone Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30 group-focus-within:text-brand-green transition-colors">
                                            <Phone size={18} strokeWidth={1.5} />
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            placeholder="+1 234 567 890"
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md font-sans"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest">Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30 group-focus-within:text-brand-green transition-colors">
                                            <Lock size={18} strokeWidth={1.5} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md font-sans"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 hover:text-brand-green transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-xs font-sans"
                                    >
                                        <ShieldCheck size={14} />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        showArrow
                                        className="w-full py-4 text-base bg-[#377E23] hover:bg-[#2D681C] shadow-xl shadow-[#3D8528]/10"
                                    >
                                        {isLoading ? "Initiating..." : "Verify Identity"}
                                    </Button>
                                </div>
                            </form>
                            <div className="mt-8 text-center">
                                <p className="text-[#1C1C1A]/40 text-xs font-sans">
                                    Already have a hub? <button onClick={() => router.push("/login")} className="text-brand-green font-bold hover:underline">Log in</button>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === "otp" && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-[400px]"
                        >
                            <div className="mb-10 text-center lg:text-left">
                                <h1 className="text-3xl font-serif text-[#1C1C1A] mb-2">
                                    {splitText("Protocol Check")}
                                </h1>
                                <p className="text-[#1C1C1A]/50 font-sans text-sm">A security signature has been dispatched to <strong>{formData.email}</strong>.</p>
                            </div>

                            <form onSubmit={handleOtpSubmit} className="space-y-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest text-center block">Enter 6-Digit Signature</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        required
                                        placeholder="000000"
                                        className="w-full text-center text-4xl tracking-[0.5em] py-5 bg-white border border-[#1C1C1A]/5 rounded-3xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/10 focus:outline-none transition-all shadow-sm font-serif"
                                    />
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-xs font-sans"
                                    >
                                        <ShieldCheck size={14} />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || otp.length < 6}
                                        className="w-full py-4 text-base bg-[#1C1C1A] hover:bg-[#333331] shadow-xl text-white font-bold"
                                    >
                                        {isLoading ? "Validating..." : "Authorize Onboarding"}
                                    </Button>
                                    <button 
                                        type="button"
                                        onClick={() => setStep("details")}
                                        className="w-full py-2 text-xs font-sans text-[#1C1C1A]/40 hover:text-[#1C1C1A] transition-colors"
                                    >
                                        Revised details? Go back.
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-[400px] text-center"
                        >
                            <div className="w-20 h-20 bg-brand-green text-white rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-green/20">
                                <CheckCircle2 size={36} />
                            </div>
                            <h1 className="text-3xl font-serif text-[#1C1C1A] mb-4">
                                {splitText("Hub Crystallized.")}
                            </h1>
                            <p className="text-[#1C1C1A]/50 font-sans text-sm mb-12">
                                Your administrative core is now active. Access the dashboard to finalize institutional architecture.
                            </p>
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full py-4 text-base bg-[#1C1C1A] hover:bg-brand-green shadow-xl text-white transition-all transform hover:scale-[1.02]"
                                showArrow
                            >
                                Enter Workspace
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 text-center text-[10px] text-[#1C1C1A]/30 font-sans tracking-[0.2em] uppercase">
                    Evalis Intelligence Protocol v1.4
                </div>
            </div>
        </div>
    );
}
