"use client";

import React, { useEffect, useRef } from 'react';

interface SecureAntiLensQuestionProps {
    text: string;
    fontSize?: number;
    className?: string;
}

export default function SecureAntiLensQuestion({ text, fontSize = 18, className = "" }: SecureAntiLensQuestionProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Container dimensions
        const maxWidth = 750;
        const padding = 20;
        const lineHeight = fontSize * 1.5;

        // Wrap text logic
        ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth - (padding * 2) && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Adjust Canvas Height
        const canvasHeight = Math.max(80, (lines.length * lineHeight) + (padding * 2));
        canvas.width = maxWidth;
        canvas.height = canvasHeight;

        // Re-get context after width/height change
        ctx.fillStyle = '#070b13'; // Dark secure background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Sub-Pixel Anti-OCR Micro Noise Pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 40, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 12) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y + 20);
            ctx.stroke();
        }

        // Render Crisp Question Text for Student Eyes
        ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';

        lines.forEach((l, index) => {
            ctx.fillText(l.trim(), padding, padding + (index * lineHeight));
        });

        // Add Subtle Security Stamp
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.fillText('PROTECTED BY SAGE ANTI-LENS OCR LOCK', canvas.width - 240, canvas.height - 18);

    }, [text, fontSize]);

    return (
        <div 
            className={`relative select-none pointer-events-none rounded-2xl overflow-hidden border border-slate-800/80 shadow-lg ${className}`}
            onContextMenu={(e) => e.preventDefault()}
        >
            <canvas 
                ref={canvasRef} 
                className="w-full h-auto block select-none pointer-events-none"
            />
        </div>
    );
}
