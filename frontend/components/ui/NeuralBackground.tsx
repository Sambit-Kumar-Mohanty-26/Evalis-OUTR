"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export function NeuralBackground() {
    const [nodes, setNodes] = React.useState<any[]>([]);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        setNodes(Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            size: Math.random() * 15 + 5,
            duration: Math.random() * 20 + 20,
            opacity: Math.random() * 0.3 + 0.1,
        })));
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                <defs>
                    <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3D8528" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3D8528" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {nodes.filter(node => node && typeof node.x === 'number' && typeof node.y === 'number').map((node) => (
                    <motion.circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill="url(#nodeGradient)"
                        animate={{
                            cx: [node.x, (node.x + 50) % 1000, node.x],
                            cy: [node.y, (node.y + 50) % 1000, node.y],
                            opacity: [node.opacity, node.opacity * 2, node.opacity],
                        }}
                        transition={{
                            duration: node.duration,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}

            </svg>
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent mix-blend-soft-light pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
        </div>
    );
}
