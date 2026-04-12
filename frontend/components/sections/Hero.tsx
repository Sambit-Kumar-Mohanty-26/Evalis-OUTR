"use client";

import { useRef, useState, useMemo } from "react";
import {
    motion,
    useScroll,
    useTransform,
    Variants,
    useMotionValueEvent,
    useMotionValue,
    useSpring
} from "framer-motion";
import { Button } from "../ui/Button";
import Link from "next/link";



type CustomProps = {
    delay: number;
    rotation: number;
    x: number;
    y: number;
    dir: number;
};

export function Hero() {
    const collageRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const [scrollDir, setScrollDir] = useState(1);

    // --- 3D TILT PHYSICS ---
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 30, stiffness: 120 };
    const rotateX = useSpring(useTransform(mouseY, [-500, 500], [5, -5]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-500, 500], [-5, 5]), springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    // --- CHARACTER SPLITTING HELPERS ---
    const splitText = (text: string) => {
        return text.split(" ").map((word, i) => (
            <span key={i} className="inline-block whitespace-nowrap">
                {word.split("").map((char, j) => (
                    <motion.span
                        key={`${i}-${j}`}
                        variants={{
                            hidden: { y: "110%", rotateZ: 12, opacity: 0 },
                            visible: {
                                y: 0,
                                rotateZ: 0,
                                opacity: 1,
                                transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                            }
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

    useMotionValueEvent(scrollY, "change", (current) => {
        const previous = scrollY.getPrevious();
        if (previous !== undefined) {
            if (current > previous + 5 && scrollDir !== 1) {
                setScrollDir(1);
            } else if (current < previous - 5 && scrollDir !== -1) {
                setScrollDir(-1);
            }
        }
    });

    const { scrollYProgress } = useScroll({
        target: collageRef,
        offset: ["start end", "end start"]
    });
    const yParallax = useTransform(scrollYProgress, [0, 1], ["10%", "-30%"]);

    const itemVariants: Variants = {
        hidden: ({ rotation, x, y, dir }: CustomProps) => ({
            opacity: 0,
            x: x * dir,
            y: y * dir,
            rotate: rotation - (15 * dir),
            scale: 0.8
        }),
        visible: ({ delay, rotation }: CustomProps) => ({
            opacity: 1,
            x: 0,
            y: 0,
            rotate: rotation,
            scale: 1,
            transition: { duration: 1.2, delay, type: "spring" as const, bounce: 0.2 }
        })
    };

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full bg-[#F4F2EB] flex flex-col pt-12 md:pt-20 perspective-[1000px]"
        >

            <div className="flex flex-col items-center text-center max-w-5xl mx-auto px-6 mb-20 md:mb-28 relative z-20">

                {/* CINEMATIC AURA */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full glow-aura pointer-events-none -z-10 opacity-60" />

                <motion.h1
                    style={{ rotateX, rotateY }}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{ visible: { transition: { staggerChildren: 0.015 } }, hidden: {} }}
                    className="font-serif text-[#2F302A] mb-8 w-full preserve-3d"
                >
                    <div className="text-5xl md:text-6xl lg:text-7xl mb-2 md:mb-4 tracking-tight leading-[1.1]">
                        {splitText("The Intelligence Behind")}
                    </div>
                    <div className="text-6xl md:text-7xl lg:text-8xl italic text-[#4A6B4A] pr-4 drop-shadow-sm leading-[1.1]">
                        {splitText("Academic Performance")}
                    </div>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="font-sans text-lg md:text-xl lg:text-2xl text-[#2F302A]/80 max-w-3xl mb-10 font-light leading-relaxed"
                >
                    Evalis transforms student data into meaningful insights, helping institutions understand performance, identify gaps, and drive better outcomes.
                </motion.p>


                <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
                    <Link href="/onboard">
                        <Button showArrow className="px-8 py-4 text-lg bg-[#448C1C] hover:bg-[#357314] shadow-xl shadow-[#448C1C]/20">
                            Get Started
                        </Button>
                    </Link>
                </motion.div>
            </div>

            <div ref={collageRef} className="relative w-full h-[80vh] md:h-[100vh] overflow-hidden border-t border-black/5">

                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: `linear-gradient(rgba(28, 28, 26, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(28, 28, 26, 0.06) 1px, transparent 1px)`,
                        backgroundSize: '120px 120px', backgroundPosition: 'center top'
                    }}
                />

                <motion.div style={{ y: yParallax }} className="relative w-full h-full max-w-[1400px] mx-auto z-10">

                    <motion.div
                        custom={{ delay: 0.1, rotation: -6, x: -250, y: 100, dir: scrollDir }}
                        variants={itemVariants}
                        initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}
                        className="absolute top-[10%] left-[-5%] md:left-[5%] w-[250px] md:w-[350px] shadow-2xl z-10 bg-[#F3EFE4] p-2"
                    >
                        <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=600" alt="Map Document" className="w-full aspect-[3/4] object-cover mix-blend-multiply opacity-80" />
                    </motion.div>

                    <motion.div
                        custom={{ delay: 0.3, rotation: 0, x: -150, y: -150, dir: scrollDir }}
                        variants={itemVariants}
                        initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}
                        className="absolute top-[5%] left-[15%] md:left-[22%] w-[180px] md:w-[240px] h-[180px] md:h-[240px] rounded-full bg-[#82B336] shadow-xl overflow-hidden z-20 flex items-center justify-center border-4 border-[#F4F2EB]"
                    >
                        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400" alt="Portrait" className="w-[120%] h-[120%] object-cover mix-blend-luminosity opacity-90 pt-8" />
                    </motion.div>

                    <motion.div
                        custom={{ delay: 0.2, rotation: 4, x: 0, y: 300, dir: scrollDir }}
                        variants={itemVariants}
                        initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}
                        className="absolute top-[15%] md:top-[20%] left-[50%] -translate-x-1/2 w-[350px] md:w-[600px] bg-white p-3 shadow-2xl z-15 border border-black/5"
                    >
                        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800" alt="Main Collage" className="w-full aspect-[4/3] object-cover grayscale-[0.5] contrast-125" />
                    </motion.div>

                    <motion.div
                        custom={{ delay: 0.4, rotation: 0, x: 200, y: 150, dir: scrollDir }}
                        variants={itemVariants}
                        initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}
                        className="absolute bottom-[20%] right-[10%] md:right-[20%] w-[160px] md:w-[220px] h-[160px] md:h-[220px] rounded-full bg-[#4196B8] shadow-xl overflow-hidden z-20 flex items-center justify-center border-4 border-[#F4F2EB]"
                    >
                        <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400" alt="Portrait" className="w-full h-full object-cover mix-blend-luminosity opacity-90" />
                    </motion.div>

                    <motion.div
                        custom={{ delay: 0.5, rotation: 8, x: 250, y: -150, dir: scrollDir }}
                        variants={itemVariants}
                        initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}
                        className="absolute top-[5%] right-[-5%] md:right-[5%] w-[200px] md:w-[280px] bg-white p-2 shadow-lg z-10"
                    >
                        <img src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=400" alt="Campus" className="w-full aspect-[16/9] object-cover grayscale-[0.8]" />
                    </motion.div>

                    <motion.div
                        custom={{ delay: 0.6, rotation: 0, x: 150, y: 250, dir: scrollDir }}
                        variants={itemVariants}
                        initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }}
                        className="absolute bottom-[10%] md:bottom-[15%] right-[30%] md:right-[35%] w-[120px] h-[150px] z-25"
                    >
                        <svg width="100%" height="100%" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 20 V50 M50 50 H20 V80 M50 50 H80 V80" stroke="#FF6314" strokeWidth="3" />
                            <rect x="35" y="0" width="30" height="40" rx="2" fill="#FF6314" />
                            <rect x="5" y="80" width="30" height="40" rx="2" fill="#FF6314" />
                            <rect x="65" y="80" width="30" height="40" rx="2" fill="#FF6314" />
                        </svg>
                    </motion.div>

                </motion.div>
            </div>

        </section>
    );
}