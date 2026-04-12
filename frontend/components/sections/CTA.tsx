"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";


export function CTA() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const buttonY = useTransform(scrollYProgress, [0, 1], ["50px", "-50px"]);

    return (
        <section ref={containerRef} className="relative w-full py-32 md:py-48 bg-[#F4F2EB] overflow-hidden flex flex-col items-center justify-center">
            <div
                className="absolute inset-0 pointer-events-none z-0 opacity-40"
                style={{
                    backgroundImage: `linear-gradient(rgba(28, 28, 26, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28, 28, 26, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }}
            />

            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 text-center md:text-left">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    >
                        <motion.span
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            className="font-sans text-[13px] font-bold tracking-[0.2em] uppercase text-[#84A942] mb-6 block"
                        >
                            Start Your Journey
                        </motion.span>

                        <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#1C1C1A] leading-[1.05] tracking-tight">
                            <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
                                Ready to write
                            </motion.div>
                            <motion.div variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }} className="italic text-[#84A942] mt-2">
                                the next chapter?
                            </motion.div>
                        </h2>

                        <motion.p
                            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2 } } }}
                            className="font-sans text-lg md:text-xl text-[#1C1C1A]/70 max-w-lg mt-8 font-light leading-relaxed mx-auto md:mx-0"
                        >
                            Join the institutions transforming their raw academic data into actionable stories of success.
                        </motion.p>
                    </motion.div>
                </div>

                <motion.div
                    style={{ y: buttonY }}
                    className="flex-shrink-0 relative group"
                >
                    <Link href="/onboard">
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", bounce: 0.4, duration: 1, delay: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative flex items-center justify-center w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#3D8528] text-white shadow-2xl cursor-pointer overflow-hidden z-10"
                        >
                            <div className="absolute inset-0 bg-[#2F6A1E] rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 ease-out origin-center" />

                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <span className="font-serif text-xl md:text-2xl font-medium tracking-wide">Get Started</span>
                                <ArrowUpRight size={28} className="group-hover:rotate-45 transition-transform duration-300" />
                            </div>
                        </motion.button>
                    </Link>

                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 md:-inset-6 border-[1px] border-dashed border-[#84A942]/50 rounded-full z-0"
                    />
                </motion.div>

            </div>
        </section>
    );
}