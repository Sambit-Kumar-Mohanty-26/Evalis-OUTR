"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const stories = [
    {
        id: 1,
        title: "Improvement Trend Across Semesters",
        description: "Track the upward trajectory. Evalis isolates semester-over-semester data to highlight where cohorts are gaining momentum and where they plateau.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
        metric: "+12%",
        metricLabel: "Avg. CGPA Growth",
    },
    {
        id: 2,
        title: "Branch Highest Performing Batch Analysis",
        description: "Discover the DNA of success. Compare historical admission batches side-by-side to understand which programs yield the highest academic excellence.",
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000",
        metric: "2024",
        metricLabel: "Highest Scoring Cohort",
    },
    {
        id: 3,
        title: "Subjects Requiring Attention",
        description: "Never let a student fall behind. Evalis automatically flags subjects with high failure rates or dropping averages, allowing for immediate intervention.",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000",
        metric: "3",
        metricLabel: "Critical Subjects Flagged",
    },
];

export function PerformanceStories() {
    const [activeCard, setActiveCard] = useState(1);

    return (
        <section className="relative w-full min-h-[95vh] py-20 md:py-24 bg-[#2C2D28] flex flex-col items-center justify-center px-4 md:px-8" id="stories">

            <svg
                preserveAspectRatio="none"
                viewBox="0 0 1440 40"
                className="absolute top-0 left-0 w-full h-[20px] md:h-[30px] text-[#F4F2EB] fill-current z-10"
            >
                <path d="
    M0,18
    C80,22 140,10 220,16
    C300,22 360,12 440,18
    C520,24 600,10 680,16
    C760,22 840,14 920,18
    C1000,22 1080,10 1160,16
    C1240,22 1320,12 1440,18
    L1440,0
    L0,0
    Z
  " />
            </svg>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-3xl px-6 mb-10 md:mb-12 z-10"
            >
                <span className="font-sans text-[12px] font-bold tracking-widest uppercase text-[#84A942] mb-3 block">
                    The Differentiator
                </span>
                <h2 className="font-serif text-4xl md:text-5xl text-[#F4F2EB] mb-4 leading-tight tracking-tight">
                    Insights That <br />
                    <span className="italic text-[#84A942]">Tell a Story</span>
                </h2>
                <p className="font-sans text-base md:text-lg text-[#F4F2EB]/70 leading-relaxed font-light">
                    Academic performance is more than numbers. Evalis highlights patterns, improvements, and challenges across students and institutions.
                </p>
            </motion.div>

            <div className="w-full max-w-[1500px] h-[400px] md:h-[500px] flex flex-col md:flex-row gap-3 md:gap-5 z-10 px-2 md:px-6">
                {stories.map((story, index) => {
                    const isActive = activeCard === index;

                    return (
                        <motion.div
                            key={story.id}
                            layout
                            onMouseEnter={() => setActiveCard(index)}
                            className={`relative h-full overflow-hidden rounded-md cursor-pointer border border-white/10 flex flex-col justify-end shadow-2xl bg-black ${isActive ? "md:flex-[4] flex-[3]" : "md:flex-[1] flex-[1]"
                                }`}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                        >
                            <motion.img
                                layout="position"
                                src={story.image}
                                alt={story.title}
                                className="absolute inset-0 w-full h-full object-cover origin-center"
                                animate={{
                                    scale: isActive ? 1.05 : 1,
                                    filter: isActive ? "grayscale(0%) sepia(0%)" : "grayscale(80%) sepia(30%) opacity(60%)"
                                }}
                                transition={{ duration: 0.8 }}
                            />

                            <div
                                className={`absolute inset-0 transition-opacity duration-700 ${isActive ? "bg-gradient-to-t from-[#1C1C1A] via-[#1C1C1A]/40 to-transparent opacity-100" : "bg-black/50 opacity-100"
                                    }`}
                            />

                            <motion.div layout="position" className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-end">

                                <motion.div
                                    className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap origin-left -rotate-90 hidden md:block"
                                    animate={{ opacity: isActive ? 0 : 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="font-serif text-xl md:text-2xl text-white tracking-wide">{story.title}</span>
                                </motion.div>

                                <motion.div
                                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 15 }}
                                    transition={{ duration: 0.5, delay: isActive ? 0.2 : 0 }}
                                    className="flex flex-col gap-2 md:gap-4"
                                    style={{ pointerEvents: isActive ? "auto" : "none" }}
                                >
                                    <div className="flex items-center gap-4 border-b border-white/20 pb-3 mb-2">
                                        <span className="font-serif text-4xl md:text-5xl text-[#84A942] drop-shadow-[0_0_15px_rgba(132,169,66,0.5)]">
                                            {story.metric}
                                        </span>
                                        <span className="font-sans text-xs md:text-sm text-[#F4F2EB]/80 font-medium uppercase tracking-widest max-w-[120px] leading-tight">
                                            {story.metricLabel}
                                        </span>
                                    </div>

                                    <h3 className="font-serif text-3xl md:text-4xl text-white leading-tight">
                                        {story.title}
                                    </h3>

                                    <p className="font-sans text-base md:text-lg text-white/80 leading-relaxed font-light hidden md:block max-w-2xl">
                                        {story.description}
                                    </p>
                                </motion.div>
                            </motion.div>

                        </motion.div>
                    );
                })}
            </div>

            <svg
                preserveAspectRatio="none"
                viewBox="0 0 1440 40"
                className="absolute bottom-0 left-0 w-full h-[20px] md:h-[30px] text-[#F4F2EB] fill-current z-10"
            >
                <path d="
    M0,22
    C80,18 140,30 220,24
    C300,18 360,28 440,22
    C520,16 600,30 680,24
    C760,18 840,26 920,22
    C1000,18 1080,30 1160,24
    C1240,18 1320,28 1440,22
    L1440,40
    L0,40
    Z
  " />
            </svg>

        </section>
    );
}