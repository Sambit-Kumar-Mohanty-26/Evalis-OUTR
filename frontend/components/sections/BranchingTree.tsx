"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";

const nodes = [
    {
        id: 1,
        title: "Institutions",
        image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400",
        x: 500, y: 150, align: "left"
    },
    {
        id: 2,
        title: "Programs",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400",
        x: 800, y: 350, align: "right"
    },
    {
        id: 3,
        title: "Branches",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400",
        x: 200, y: 600, align: "left"
    },
    {
        id: 4,
        title: "Batches",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400",
        x: 800, y: 850, align: "right"
    },
    {
        id: 5,
        title: "Semesters",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400",
        x: 500, y: 1100, align: "left"
    },
];

export function BranchingTree() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    useEffect(() => {
        setMounted(true);
        const handleResize = () => setIsDesktop(window.innerWidth > 768);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end 70%"]
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full min-h-[1400px] bg-[#F4F2EB] overflow-hidden flex flex-col items-center pt-24 pb-32"
            id="about"
        >
            <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                variants={{ visible: { transition: { staggerChildren: 0.15 } }, hidden: {} }}
                className="text-center z-20 max-w-4xl px-6 mb-12"
            >
                <motion.h2
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                    className="font-serif text-5xl md:text-6xl text-[#1C1C1A] mb-6 leading-tight tracking-tight"
                >
                    Understanding Academic <br />
                    <span className="italic text-[#84A942]">Journeys at Every Level</span>
                </motion.h2>
                <motion.p
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
                    className="font-sans text-lg md:text-xl text-[#1C1C1A]/70 leading-relaxed font-light mx-auto max-w-2xl"
                >
                    From institutions to individual students, Evalis maps the entire academic structure into a connected system of insights.
                </motion.p>
            </motion.div>
            <div className="relative w-full max-w-5xl h-[1200px] mx-auto mt-4">

                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
                    viewBox="0 0 1000 1200"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M 500,0 L 500,150 C 500,250 800,250 800,350 C 800,475 200,475 200,600 C 200,725 800,725 800,850 C 800,975 500,975 500,1100 L 500,1200" stroke="#84A942" strokeWidth="4" strokeOpacity="0.15" strokeLinecap="round" />
                    <motion.path d="M 500,0 L 500,150 C 500,250 800,250 800,350 C 800,475 200,475 200,600 C 200,725 800,725 800,850 C 800,975 500,975 500,1100 L 500,1200" stroke="#84A942" strokeWidth="4" strokeLinecap="round" style={{ pathLength: scrollYProgress }} />
                </svg>
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none md:hidden"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    fill="none"
                >
                    <path d="M 15,0 V 100" stroke="#84A942" strokeWidth="2" strokeOpacity="0.15" />
                    <motion.path d="M 15,0 V 100" stroke="#84A942" strokeWidth="2" style={{ pathLength: scrollYProgress }} />
                </svg>
                {mounted && nodes.map((node, index) => {
                    const leftPercent = isDesktop ? (node.x / 1000) * 100 : 15;
                    const topPercent = isDesktop ? (node.y / 1200) * 100 : 15 + (index * 18);
                    const align = isDesktop ? node.align : "right";

                    return (
                        <div
                            key={node.id}
                            className="absolute z-20"
                            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                        >
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true, margin: "-20%" }}
                                transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
                                className="absolute w-5 h-5 rounded-full bg-[#F4F2EB] border-[4px] border-[#84A942] z-20 shadow-sm -translate-x-1/2 -translate-y-1/2"
                            >
                                <div className="absolute inset-0 rounded-full bg-[#84A942] animate-ping opacity-30" />
                            </motion.div>
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-20%" }}
                                variants={{
                                    hidden: { opacity: 0, x: align === "left" ? 30 : -30 },
                                    visible: {
                                        opacity: 1,
                                        x: 0,
                                        transition: { duration: 0.6, delay: 0.2, type: "spring", bounce: 0.3 }
                                    }
                                }}
                                whileHover={{ scale: 1.05, zIndex: 40 }}
                                className="absolute flex flex-col items-center z-30"
                                style={{
                                    [align === "left" ? "right" : "left"]: isDesktop ? "40px" : "30px",
                                    top: "0px",
                                    y: "-50%"
                                }}
                            >
                                <div className="absolute inset-0 bg-white shadow-xl rounded-sm rotate-[-4deg] scale-[1.02] border border-black/5 z-0" />

                                <div className="relative p-2 pb-5 md:p-3 md:pb-6 bg-white shadow-2xl border border-black/5 cursor-pointer group rounded-sm rotate-[2deg] hover:rotate-0 transition-all duration-300 z-10 w-40 md:w-56">
                                    <motion.div
                                        variants={{
                                            hidden: { opacity: 0, y: -40, scale: 1.5 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                                transition: { duration: 0.5, delay: 0.7, type: "spring", bounce: 0.5, stiffness: 200 }
                                            }
                                        }}
                                        className="absolute -top-[22px] md:-top-[26px] left-1/2 -translate-x-1/2 z-40 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] origin-bottom"
                                    >
                                        <img
                                            src="/pin.png"
                                            alt="Red Push Pin"
                                            className="w-10 h-10 md:w-12 md:h-12 object-contain"
                                        />
                                    </motion.div>

                                    <div className="overflow-hidden relative shadow-inner mt-2">
                                        <img
                                            src={node.image}
                                            alt={node.title}
                                            className="w-full aspect-[4/3] object-cover filter sepia-[0.3] grayscale-[0.2] transition-all duration-500 group-hover:scale-105 group-hover:sepia-0 group-hover:grayscale-0"
                                        />
                                    </div>

                                    <div className="mt-3 md:mt-4 text-center">
                                        <span className="font-sans font-semibold text-base md:text-xl text-[#2F302A] tracking-tight">
                                            {node.title}
                                        </span>
                                        <div className="w-6 h-[2px] bg-[#84A942] mx-auto mt-1 opacity-80" />
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    );
                })}

            </div>
        </section>
    );
}