"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { EvalisLogo } from "@/components/ui/EvalisLogo";
import { Button } from "@/components/ui/Button";
import { NeuralBackground } from "@/components/ui/NeuralBackground";
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || "Login failed. Please try again.");
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
                            {splitText("Access the Intelligence of your Institution.")}
                        </h2>
                        <p className="text-[#1C1C1A]/60 text-lg font-light leading-relaxed max-w-md">
                            A high-precision interface designed for academic excellence. Securely manage performance metrics and institutional growth.
                        </p>
                    </motion.div>
                    <div className="flex flex-wrap gap-3">
                        {["Real-time Analytics", "Neural Insights", "Admin Secure"].map((feature, i) => (
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

            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 md:p-12 relative">
                <div className="lg:hidden absolute top-8 left-8">
                    <EvalisLogo />
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-[400px]"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-serif text-[#1C1C1A] mb-2">
                            {splitText("Welcome back")}
                        </h1>
                        <p className="text-[#1C1C1A]/50 font-sans text-sm">Please enter your credentials to proceed.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest">Institutional Email</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30 group-focus-within:text-brand-green transition-colors">
                                    <Mail size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    suppressHydrationWarning
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@university.edu"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md font-sans"
                                />
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileHover={{ scaleX: 0.05 }}
                                    className="absolute bottom-0 left-0 h-[2px] w-full bg-brand-green origin-left peer-focus:scaleX-100 transition-transform duration-500 ease-out"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-sans font-medium text-[#1C1C1A]/60 ml-1 uppercase tracking-widest">Secure Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/30 group-focus-within:text-brand-green transition-colors">
                                    <Lock size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    suppressHydrationWarning
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-white border border-[#1C1C1A]/5 rounded-2xl text-[#1C1C1A] placeholder:text-[#1C1C1A]/20 focus:outline-none transition-all shadow-sm group-hover:shadow-md font-sans"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1C1C1A]/20 hover:text-brand-green transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                                </button>
                                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#1C1C1A]/5" />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                                    className="flex items-center gap-2 p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-600 text-sm font-sans"
                                >
                                    <ShieldCheck size={16} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                showArrow
                                className="w-full py-4 text-base bg-[#3D8528] hover:bg-[#2F6A1E] shadow-xl shadow-[#3D8528]/10"
                            >
                                {isLoading ? "Authenticating..." : "Establish Access"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-12 text-center text-[10px] text-[#1C1C1A]/30 font-sans tracking-[0.2em] uppercase">
                        Evalis Intelligence Protocol v1.4
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
