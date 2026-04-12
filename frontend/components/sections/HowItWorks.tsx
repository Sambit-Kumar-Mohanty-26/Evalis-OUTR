"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from "framer-motion";

const steps = [
    {
        num: "01",
        title: "Set Up Academic Structure",
        desc: "Configure programs, branches, and semesters to build your institution's digital foundation.",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800",
    },
    {
        num: "02",
        title: "Input Academic Data",
        desc: "Add students and record performance data securely through a seamless, grid-based interface.",
        image: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800",
    },
    {
        num: "03",
        title: "Analyze Performance",
        desc: "Evalis automatically processes grades, computes weighted CGPA, and evaluates academic metrics instantly.",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    },
    {
        num: "04",
        title: "Generate Insights",
        desc: "View stunning dashboards, generate reports, and unlock predictions for better academic decision-making.",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800",
    },
];

export function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const lastIndexRef = useRef(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const stickyY = useTransform(scrollYProgress, [0, 1], [0, vh * 0.6]);
    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const next =
            latest < 0.22 ? 0 :
                latest < 0.47 ? 1 :
                    latest < 0.72 ? 2 : 3;
        if (next !== lastIndexRef.current) {
            lastIndexRef.current = next;
            setActiveIndex(next);
        }
    });

    return (
        <section ref={containerRef} className="relative w-full h-[160vh] bg-[#F4F2EB]" id="how-it-works">

            <motion.div
                style={{ y: stickyY, willChange: "transform" }}
                className="absolute top-0 left-0 w-full h-screen flex items-center justify-center border-t border-black/5 z-10"
            >

                <div
                    className="absolute inset-0 pointer-events-none z-0 opacity-40"
                    style={{
                        backgroundImage: `linear-gradient(rgba(28, 28, 26, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(28, 28, 26, 0.08) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px'
                    }}
                />

                <div className="relative w-full max-w-7xl px-8 md:px-16 flex flex-col md:flex-row items-center justify-between z-10 gap-12">
                    <div className="w-full md:w-1/2 relative h-[350px] md:h-[450px] flex flex-col justify-center">

                        <div className="mb-10 md:mb-16 flex flex-col items-start z-20 relative">
                            <span className="font-sans text-[13px] font-bold tracking-widest uppercase text-[#84A942] mb-2 block">
                                Workflow
                            </span>
                            <h2 className="font-serif text-4xl md:text-5xl text-[#1C1C1A] border-b-[3px] border-[#1C1C1A]/10 pb-4 inline-block">
                                How It Works
                            </h2>
                        </div>

                        <div className="relative w-full h-[250px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="absolute inset-0 flex flex-col justify-center"
                                >
                                    <div className="relative mb-4">
                                        <span className="absolute -top-10 md:-top-14 left-0 font-serif text-[100px] md:text-[140px] text-[#1C1C1A]/5 leading-none select-none z-0">
                                            {steps[activeIndex].num}
                                        </span>

                                        <h3 className="font-serif text-3xl md:text-4xl text-[#1C1C1A] leading-tight relative z-10 pt-4">
                                            {steps[activeIndex].title}
                                        </h3>
                                    </div>

                                    <p className="font-sans text-lg md:text-xl text-[#1C1C1A]/80 max-w-md leading-relaxed ml-1 md:ml-4 border-l-2 border-[#84A942] pl-4 md:pl-6 relative z-10 bg-[#F4F2EB]/50 backdrop-blur-sm py-1">
                                        {steps[activeIndex].desc}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                    </div>

                    <div className="w-full md:w-1/2 relative h-[400px] md:h-[600px] flex items-center justify-center">

                        <motion.div
                            animate={{ scale: activeIndex > 0 ? 0.95 : 1, rotate: -4 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="absolute z-10 w-[280px] md:w-[420px]"
                            style={{ willChange: "transform" }}
                        >
                            <div className="bg-white p-3 md:p-4 pb-12 md:pb-16 shadow-xl border border-black/5">
                                <img src={steps[0].image} alt="Step 1" className="w-full aspect-[4/3] object-cover filter sepia-[0.3] grayscale-[0.2]" />
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-serif text-lg text-black/60">Step 01</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: -800, opacity: 0, rotate: 20 }}
                            animate={{
                                y: activeIndex >= 1 ? 0 : -800,
                                opacity: activeIndex >= 1 ? 1 : 0,
                                rotate: activeIndex >= 1 ? 4 : 20,
                                scale: activeIndex > 1 ? 0.95 : 1
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="absolute z-20 w-[280px] md:w-[420px]"
                            style={{ willChange: "transform, opacity" }}
                        >
                            <div className="bg-white p-3 md:p-4 pb-12 md:pb-16 shadow-2xl border border-black/5">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/60 backdrop-blur-md rotate-2 border border-black/5 shadow-sm" />
                                <img src={steps[1].image} alt="Step 2" className="w-full aspect-[4/3] object-cover filter sepia-[0.2] grayscale-[0.1]" />
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-serif text-lg text-black/60">Step 02</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: -800, opacity: 0, rotate: -20 }}
                            animate={{
                                y: activeIndex >= 2 ? 0 : -800,
                                opacity: activeIndex >= 2 ? 1 : 0,
                                rotate: activeIndex >= 2 ? -2 : -20,
                                scale: activeIndex > 2 ? 0.95 : 1
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="absolute z-30 w-[280px] md:w-[420px]"
                            style={{ willChange: "transform, opacity" }}
                        >
                            <div className="bg-white p-3 md:p-4 pb-12 md:pb-16 shadow-2xl border border-black/5">
                                <img src={steps[2].image} alt="Step 3" className="w-full aspect-[4/3] object-cover filter sepia-[0.1]" />
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-serif text-lg text-black/60">Step 03</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: -800, opacity: 0, rotate: 20 }}
                            animate={{
                                y: activeIndex >= 3 ? 0 : -800,
                                opacity: activeIndex >= 3 ? 1 : 0,
                                rotate: activeIndex >= 3 ? 3 : 20
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="absolute z-40 w-[280px] md:w-[420px]"
                            style={{ willChange: "transform, opacity" }}
                        >
                            <div className="bg-white p-3 md:p-4 pb-12 md:pb-16 shadow-2xl border border-black/5 group">
                                <img src={steps[3].image} alt="Step 4" className="w-full aspect-[4/3] object-cover transition-all duration-500 group-hover:scale-105" />
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-serif text-xl text-[#84A942] font-semibold">Ready to Insight</span>

                                <motion.div
                                    initial={{ opacity: 0, scale: 2, y: -50 }}
                                    animate={{
                                        opacity: activeIndex === 3 ? 1 : 0,
                                        scale: activeIndex === 3 ? 1 : 2,
                                        y: activeIndex === 3 ? 0 : -50
                                    }}
                                    transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                                    className="absolute -top-6 left-1/2 -translate-x-1/2 origin-bottom drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] z-50"
                                >
                                    <img src="/pin.png" alt="Pin" className="w-12 h-12 object-contain" />
                                </motion.div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </motion.div>
        </section>
    );
}