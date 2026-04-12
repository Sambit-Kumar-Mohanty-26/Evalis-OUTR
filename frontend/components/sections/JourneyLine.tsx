"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const journeySteps = [
    {
        id: 1,
        title: "The Foundation",
        entity: "Institution & Schools",
        description: "Every story starts at the root. Manage multiple schools and overarching academic structures in one centralized hub.",
        align: "left",
        image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: 2,
        title: "The Path",
        entity: "Programs & Branches",
        description: "Branching out into specializations. Compare analytics between Computer Science, Mechanical, and other departments instantly.",
        align: "right",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "The Cohort",
        entity: "Batches & Students",
        description: "Focusing on the individuals. Track admission cohorts over the years and monitor personal academic growth.",
        align: "left",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: 4,
        title: "The Milestones",
        entity: "Semesters & Exams",
        description: "The defining moments. Enter marks seamlessly, compute CGPA automatically, and generate comprehensive performance reports.",
        align: "right",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop"
    }
];

export function JourneyLine() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start center", "end 80%"]
    });

    return (
        <section
            ref={containerRef}
            className="relative w-full py-32 bg-[#F4F2EB] overflow-hidden"
            id="about"
        >
            <div className="max-w-7xl mx-auto px-8 relative">

                <div className="text-center mb-24 relative z-10">
                    <h2 className="font-serif text-5xl md:text-6xl text-[#1C1C1A] mb-4">
                        Tracing the <br className="md:hidden" />
                        <span className="italic text-[#4A6B4A]">Academic Lineage</span>
                    </h2>
                    <p className="font-sans text-lg text-[#1C1C1A]/70 max-w-2xl mx-auto">
                        Just like a family tree, academic success is built generation by generation, semester by semester. See how data flows through Evalis.
                    </p>
                </div>

                <div className="absolute left-8 md:left-1/2 top-[250px] bottom-0 w-[4px] bg-[#E2DFD2] md:-translate-x-1/2 rounded-full overflow-hidden">
                    <motion.div
                        className="w-full bg-[#84A942] origin-top"
                        style={{ scaleY: scrollYProgress }}
                    />
                </div>

                <div className="relative z-10 flex flex-col gap-24 md:gap-32">
                    {journeySteps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full ${step.align === "left" ? "md:flex-row" : "md:flex-row-reverse"
                                }`}
                        >

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, type: "spring" }}
                                className="w-full md:w-1/2 flex justify-center pl-12 md:pl-0"
                            >
                                <div className="relative p-3 bg-white shadow-xl border border-black/5 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                                    <img
                                        src={step.image}
                                        alt={step.entity}
                                        className="w-full max-w-[300px] aspect-[4/3] object-cover sepia-[0.4] grayscale-[0.2]"
                                    />
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/50 backdrop-blur-sm shadow-sm rotate-3 border border-black/5" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: step.align === "left" ? 50 : -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="w-full md:w-1/2 pl-12 md:pl-0 text-left"
                            >
                                <span className="text-[#84A942] font-serif italic text-xl mb-2 block">
                                    {step.title}
                                </span>
                                <h3 className="text-3xl md:text-4xl font-serif text-[#1C1C1A] mb-4">
                                    {step.entity}
                                </h3>
                                <p className="font-sans text-lg text-[#1C1C1A]/80 leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>

                            <div className={`absolute hidden md:block w-[15%] h-[2px] bg-[#84A942] top-1/2 -translate-y-1/2 origin-left z-0 ${step.align === "left" ? "right-1/2" : "left-1/2"
                                }`}>
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className={`w-full h-full bg-[#84A942] ${step.align === "left" ? "origin-right" : "origin-left"}`}
                                />
                            </div>

                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="absolute left-[30px] md:left-1/2 w-4 h-4 rounded-full bg-[#F4F2EB] border-4 border-[#84A942] md:-translate-x-1/2 z-20"
                            />

                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}