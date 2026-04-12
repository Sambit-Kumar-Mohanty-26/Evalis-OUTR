"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SketchyLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function SketchyLink({ href, children, className }: SketchyLinkProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (href.startsWith("#")) {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    };

    return (
        <Link
            href={href}
            className={cn("relative inline-block text-brand-text font-serif text-xl tracking-wide", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <span>{children}</span>

            <svg
                className="absolute -bottom-2 left-0 w-full h-[8px] text-brand-green overflow-visible"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <motion.path
                    d="M 2,5 Q 25,2 50,6 T 98,4"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: isHovered ? 1 : 0,
                        opacity: isHovered ? 1 : 0
                    }}
                    transition={{
                        duration: 0.3,
                        ease: "easeOut"
                    }}
                />
            </svg>
        </Link>
    );
}