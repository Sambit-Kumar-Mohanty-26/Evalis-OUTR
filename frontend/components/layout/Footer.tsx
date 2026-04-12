"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

export function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative w-full bg-[#E6DED0] text-[#2C2A26] pt-20 md:pt-28 overflow-hidden border-t border-black/5">

            <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10 flex flex-col justify-between min-h-[50vh]">
                <div className="flex flex-col-reverse md:flex-row justify-between items-start gap-16 md:gap-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-20 w-full md:w-auto">

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                            <h4 className="font-serif font-bold text-lg text-[#2C2A26] mb-5">Evalis</h4>
                            <ul className="flex flex-col gap-3 font-sans text-[15px] text-[#2C2A26]/70 font-medium">
                                <li>evalis.io</li>
                                <li>Innovation Park, Block A</li>
                                <li>560100, Bengaluru</li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                            <h4 className="font-serif font-bold text-lg text-[#2C2A26] mb-5">Get in touch</h4>
                            <ul className="flex flex-col gap-3 font-sans text-[15px] text-[#2C2A26]/70 font-medium">
                                <li><Link href="#" className="hover:text-black transition-colors">Contact us</Link></li>
                                <li><Link href="#" className="hover:text-black transition-colors">Instagram</Link></li>
                                <li><Link href="#" className="hover:text-black transition-colors">LinkedIn</Link></li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                            <h4 className="font-serif font-bold text-lg text-[#2C2A26] mb-5">Platform</h4>
                            <ul className="flex flex-col gap-3 font-sans text-[15px] text-[#2C2A26]/70 font-medium">
                                <li><Link href="#analytics" className="hover:text-black transition-colors">Analytics</Link></li>
                                <li><Link href="#stories" className="hover:text-black transition-colors">Insights</Link></li>
                                <li><Link href="#how-it-works" className="hover:text-black transition-colors">Workflow</Link></li>
                            </ul>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                            <h4 className="font-serif font-bold text-lg text-[#2C2A26] mb-5">Legal</h4>
                            <ul className="flex flex-col gap-3 font-sans text-[15px] text-[#2C2A26]/70 font-medium">
                                <li><Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-black transition-colors">Terms of Service</Link></li>
                                <li><Link href="/login" className="hover:text-[#84A942] transition-colors">Admin Login</Link></li>
                            </ul>
                        </motion.div>

                    </div>

                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.4 }}
                        className="self-end md:self-auto mb-8 md:mb-0 relative flex items-center justify-center w-36 h-36 md:w-40 md:h-40 group cursor-pointer"
                        onClick={scrollToTop}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-full h-full text-[#2C2A26] group-hover:opacity-60 transition-opacity duration-500"
                        >
                            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="none" />
                                <text className="text-[12px] font-sans font-bold tracking-[0.2em] uppercase fill-current">
                                    <textPath href="#circlePath">Back to top • Scroll up • </textPath>
                                </text>
                            </svg>
                        </motion.div>
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#2C2A26] text-[#E6DED0] flex items-center justify-center shadow-2xl overflow-hidden transform-gpu isolation-isolate transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-125 z-10">
                            <ArrowUp
                                size={26}
                                className="absolute transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-20"
                            />
                            <ArrowUp
                                size={26}
                                className="absolute translate-y-20 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 text-[#FFB3D9]"
                            />
                        </div>
                    </motion.div>

                </div>
                <div className="w-full flex justify-center items-end mt-12 md:mt-16 overflow-hidden pointer-events-none select-none px-4">
                    <motion.div
                        initial={{ y: 150, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true, margin: "100px" }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-sans font-black text-[19vw] leading-[0.75] tracking-[-0.04em] text-[#2C2A26] flex items-baseline translate-y-[-2%]"
                    >
                        <span>e</span>
                        <span>v</span>
                        <span>a</span>
                        <span>l</span>

                        <span className="inline-block -rotate-6 origin-bottom translate-y-[-1vw]">i</span>

                        <span>s</span>
                        <span className="text-[#FFB3D9] ml-[0.5vw] inline-block scale-110">.</span>

                    </motion.div>
                </div>

            </div>
        </footer>
    );
}