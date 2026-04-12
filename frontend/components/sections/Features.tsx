"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import Link from "next/link";
import { Plus } from "lucide-react";


const col1 = [
    { id: 1, title: "Student Profiles", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=400", aspect: "aspect-[4/3]" },
    { id: 4, title: "CGPA Tracking", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400", aspect: "aspect-video" }
];

const col2 = [
    { id: 2, title: "Subject Insights", image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=400", aspect: "aspect-square" },
    { id: 5, title: "Batch Insights", image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=400", aspect: "aspect-video" }
];

const col3 = [
    { id: 3, title: "Semester Trends", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400", aspect: "aspect-[4/3]" },
    { id: 6, title: "Reports & Summaries", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400", aspect: "aspect-[4/3]" }
];

const cardVariants = {
    hidden: { opacity: 0, y: 80, scale: 0.85, filter: "blur(12px)", rotateZ: -4 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        rotateZ: 0,
        transition: {
            delay: i * 0.15,
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1] as const
        }
    })
};

const AncestryCard = ({ feature, index }: { feature: any, index: number }) => (
    <motion.div
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={cardVariants}
        className="bg-[#EBE5D9] p-2 pb-2 flex flex-col group cursor-pointer shadow-sm border border-black/5"
    >
        <div className="mb-2 mt-0.5 px-1">
            <h3 className="font-sans text-[13px] md:text-[14px] font-semibold text-[#2F302A] tracking-tight">
                {feature.title}
            </h3>
        </div>

        <div className="overflow-hidden relative w-full bg-black/10">
            <motion.img
                src={feature.image}
                alt={feature.title}
                className={`w-full ${feature.aspect} object-cover filter sepia-[0.4] grayscale-[0.3]`}
                whileHover={{ scale: 1.08, filter: "sepia(0) grayscale(0)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none" />
        </div>
    </motion.div>
);

export function Features() {
    const textReveal = {
        hidden: { y: "120%", rotate: 2, opacity: 0 },
        visible: {
            y: "0%",
            rotate: 0,
            opacity: 1,
            transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }
        }
    };

    return (
        <section className="relative w-full min-h-[90vh] flex flex-col justify-center bg-[#373631] text-[#F4F2EB] px-8 md:px-16 py-16" id="analytics">
            <svg preserveAspectRatio="none" viewBox="0 0 1200 20" className="absolute top-0 left-0 w-full h-[15px] md:h-[20px] text-[#F4F2EB] fill-current z-10 drop-shadow-sm">
                <path d="M0,0 L1200,0 L1200,10 Q1175,15 1150,8 T1100,12 T1050,7 T1000,14 T950,9 T900,15 T850,8 T800,13 T750,7 T700,15 T650,9 T600,14 T550,8 T500,15 T450,9 T400,14 T350,7 T300,15 T250,9 T200,13 T150,7 T100,15 T50,8 T0,12 Z" />
            </svg>

            <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-12 md:gap-16 items-center z-20">

                <div className="w-full lg:w-1/3 z-20 text-center lg:text-left">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

                        <h2 className="font-serif text-5xl md:text-6xl leading-[1.05] mb-5 tracking-tight flex flex-col items-center lg:items-start">
                            <div className="overflow-hidden pb-2">
                                <motion.span variants={textReveal} className="block origin-bottom-left">
                                    Explore Insights
                                </motion.span>
                            </div>
                            <div className="overflow-hidden pb-2">
                                <motion.span variants={textReveal} className="block italic text-[#EBE5D9] origin-bottom-left">
                                    Across Academic Data.
                                </motion.span>
                            </div>
                        </h2>

                        <div className="overflow-hidden mb-8 max-w-md mx-auto lg:mx-0">
                            <motion.p variants={textReveal} className="font-sans text-base md:text-lg text-[#F4F2EB]/80 leading-relaxed font-light">
                                Evalis connects performance data across students, subjects, and semesters to reveal patterns that drive better academic decisions.
                            </motion.p>
                        </div>

                        <div className="overflow-hidden pt-2">
                            <motion.div variants={textReveal}>
                                <Link href="/onboard">
                                    <Button className="px-8 py-3.5 text-lg bg-[#3D8528] hover:bg-[#2F6A1E] text-white border-none shadow-xl shadow-black/20 hover:scale-105 transition-transform duration-300">
                                        Get started
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>

                    </motion.div>
                </div>

                <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 z-20">

                    <div className="flex flex-col gap-4 pt-0 md:pt-4">
                        {col1.map((feat, i) => <AncestryCard key={feat.id} feature={feat} index={i} />)}
                    </div>

                    <div className="flex flex-col gap-4 pt-0 md:pt-12">
                        <AncestryCard feature={col2[0]} index={2} />

                        <motion.div
                            custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={cardVariants}
                            className="border-[1.5px] border-dashed border-[#EBE5D9]/40 p-4 py-6 flex flex-col items-center justify-center cursor-pointer group hover:bg-white/5 transition-colors duration-300 min-h-[140px]"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#EBE5D9] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Plus size={20} className="text-[#373631]" />
                            </div>
                            <span className="font-serif text-[17px] text-[#EBE5D9] text-center leading-tight">
                                Discover <br />Insights
                            </span>
                        </motion.div>

                        <AncestryCard feature={col2[1]} index={4} />
                    </div>

                    <div className="flex flex-col gap-4 pt-0 md:pt-6">
                        {col3.map((feat, i) => <AncestryCard key={feat.id} feature={feat} index={i + 5} />)}
                    </div>

                </div>
            </div>

            <svg preserveAspectRatio="none" viewBox="0 0 1200 20" className="absolute bottom-0 left-0 w-full h-[15px] md:h-[20px] text-[#F4F2EB] fill-current z-10 drop-shadow-[0_-2px_2px_rgba(0,0,0,0.05)]">
                <path d="M0,20 L1200,20 L1200,10 Q1175,5 1150,12 T1100,8 T1050,13 T1000,6 T950,11 T900,5 T850,12 T800,7 T750,13 T700,5 T650,11 T600,6 T550,12 T500,5 T450,11 T400,6 T350,13 T300,5 T250,11 T200,7 T150,13 T100,5 T50,12 T0,8 Z" />
            </svg>

        </section>
    );
}