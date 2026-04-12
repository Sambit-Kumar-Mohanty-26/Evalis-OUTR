"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

export function StardustBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            color: string;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.color = Math.random() > 0.5 ? "#FFB3D9" : "#3D8528";
            }

            update(mouseX: number, mouseY: number) {
                this.x += this.speedX;
                this.y += this.speedY;

                // Interaction with mouse "Gravity"
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 200) {
                    const force = (200 - distance) / 200;
                    this.x += dx * force * 0.02;
                    this.y += dy * force * 0.02;
                }

                if (this.x > width) this.x = 0;
                else if (this.x < 0) this.x = width;
                if (this.y > height) this.y = 0;
                else if (this.y < 0) this.y = height;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.fill();

                // Subtle glow for pink particles
                if (this.color === "#FFB3D9") {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = "#FFB3D9";
                } else {
                    ctx.shadowBlur = 0;
                }
            }
        }

        let mouseX = width / 2;
        let mouseY = height / 2;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const init = () => {
            particles = [];
            for (let i = 0; i < 150; i++) {
                particles.push(new Particle());
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            particles.forEach((p) => {
                p.update(mouseX, mouseY);
                p.draw();
            });
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        resize();
        init();
        render();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F4F2EB] via-transparent to-white/20" />
        </div>
    );
}
