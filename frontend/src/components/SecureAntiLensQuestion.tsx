"use client";

import React, { useEffect, useRef } from 'react';

interface SecureAntiLensQuestionProps {
    text: string;
    fontSize?: number;
    className?: string;
    studentIdentifier?: string;
}

// Injects invisible zero-width spaces (\u200B) every 2nd character to corrupt external OCR / Google Lens
export function obfuscateTextForLens(str: string): string {
    if (!str) return "";
    return str
        .split("")
        .map((ch, i) => (i % 2 === 0 ? ch + "\u200B" : ch))
        .join("");
}

export default function SecureAntiLensQuestion({ 
    text, 
    fontSize = 17, 
    className = "",
    studentIdentifier = "SAGE SECURE EXAM"
}: SecureAntiLensQuestionProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Container dimensions
        const maxWidth = 750;
        const padding = 22;
        const lineHeight = fontSize * 1.55;

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
        const canvasHeight = Math.max(90, (lines.length * lineHeight) + (padding * 2));
        canvas.width = maxWidth;
        canvas.height = canvasHeight;

        // Dark secure background
        ctx.fillStyle = '#070b13';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. High-Frequency Anti-OCR Micro Noise Lines (confuses machine vision edge-detection)
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 14) {
            ctx.strokeStyle = x % 28 === 0 ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 50, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 14) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y + 25);
            ctx.stroke();
        }

        // 2. Embedded Diagonal Anti-Leak Watermark across the canvas
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-0.25); // ~15 degree tilt
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.textAlign = 'center';
        for (let dy = -120; dy <= 120; dy += 45) {
            ctx.fillText(`• ${studentIdentifier} • SAGE VERIFIED ASSESSMENT •`, 0, dy);
        }
        ctx.restore();

        // 3. Render Crisp Question Text for Human Eyes
        ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#f8fafc';
        ctx.textBaseline = 'top';

        lines.forEach((l, index) => {
            ctx.fillText(l.trim(), padding, padding + (index * lineHeight));
        });

        // 4. Anti-OCR Security Stamp in corner
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.fillText('🔒 SAGE AI ANTI-LENS WATERMARKED BITMAP', canvas.width - 245, canvas.height - 14);

    }, [text, fontSize, studentIdentifier]);

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
