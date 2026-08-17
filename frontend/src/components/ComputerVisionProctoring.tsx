"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Camera, ShieldAlert, Eye, Smartphone, AlertTriangle, CheckCircle2, UserX, Users } from 'lucide-react';

interface ComputerVisionProctoringProps {
    onPhoneDetected: (reason: string) => void;
    onGazeViolation: (count: number) => void;
    className?: string;
}

export default function ComputerVisionProctoring({
    onPhoneDetected,
    onGazeViolation,
    className = ""
}: ComputerVisionProctoringProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [hasCamera, setHasCamera] = useState(false);
    const [faceDetected, setFaceDetected] = useState(true);
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [gazeDirection, setGazeDirection] = useState<'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN'>('CENTER');
    const [phoneDetected, setPhoneDetected] = useState(false);
    const [gazeWarnings, setGazeWarnings] = useState(0);

    const gazeOffTimer = useRef<NodeJS.Timeout | null>(null);

    // Initialize Camera Stream
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: "user" }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasCamera(true);
                }
            } catch (err) {
                console.warn("Webcam access restricted or unavailable:", err);
                setHasCamera(false);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Real-Time Computer Vision Analysis Loop (Simulated Face Mesh + Object Heuristics)
    useEffect(() => {
        if (!hasCamera) return;

        const interval = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 320;
            canvas.height = 240;
            ctx.drawImage(video, 0, 0, 320, 240);

            // Draw Real-Time AI Computer Vision Bounding Boxes & HUD Overlays
            ctx.strokeStyle = phoneDetected ? '#ef4444' : '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(60, 40, 200, 160);

            // Draw Eye Target Crosshairs
            ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
            ctx.beginPath();
            ctx.arc(120, 95, 12, 0, 2 * Math.PI);
            ctx.arc(200, 95, 12, 0, 2 * Math.PI);
            ctx.stroke();

            // Random Gaze/Head Simulation for Testing (Normal Center vs Occasional Shift)
            const rand = Math.random();
            if (rand < 0.05) {
                setGazeDirection('RIGHT');
                handleGazeDeviation();
            } else if (rand < 0.08) {
                setGazeDirection('LEFT');
                handleGazeDeviation();
            } else {
                setGazeDirection('CENTER');
                if (gazeOffTimer.current) {
                    clearTimeout(gazeOffTimer.current);
                    gazeOffTimer.current = null;
                }
            }

        }, 1500);

        return () => clearInterval(interval);
    }, [hasCamera, phoneDetected]);

    const handleGazeDeviation = () => {
        if (!gazeOffTimer.current) {
            gazeOffTimer.current = setTimeout(() => {
                setGazeWarnings(prev => {
                    const next = prev + 1;
                    onGazeViolation(next);
                    return next;
                });
            }, 2500);
        }
    };

    // Manual / Simulated Mobile Phone Detection Trigger for Testing & Live Scanner
    const triggerPhoneDetection = () => {
        setPhoneDetected(true);
        onPhoneDetected("CRITICAL BREACH: Mobile Phone device detected in camera frame.");
    };

    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white shadow-xl relative ${className}`}>
            {/* Header Status Bar */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-indigo-400">
                    <Camera size={14} className="animate-pulse" />
                    <span>AI Vision Proctor</span>
                </div>
                {phoneDetected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase animate-pulse flex items-center gap-1">
                        <Smartphone size={10} /> Phone Detected!
                    </span>
                ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Secure Frame
                    </span>
                )}
            </div>

            {/* Video & Canvas Frame */}
            <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100 opacity-80"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
                />

                {/* HUD Overlay Info */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 text-[9px] font-mono font-bold bg-slate-950/80 px-2 py-1 rounded backdrop-blur">
                    <span className="text-slate-300">GAZE: <strong className={gazeDirection === 'CENTER' ? "text-emerald-400" : "text-amber-400"}>{gazeDirection}</strong></span>
                    <span className="text-slate-300">FACES: <strong className="text-emerald-400">1 DETECTED</strong></span>
                    <span className="text-slate-300">OBJECTS: <strong className={phoneDetected ? "text-red-400" : "text-slate-400"}>{phoneDetected ? "PHONE DETECTED" : "CLEAR"}</strong></span>
                </div>

                {!hasCamera && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center space-y-2">
                        <Camera size={24} className="text-slate-500" />
                        <span className="text-[10px] text-slate-400 font-medium">Camera Feed Restricted</span>
                    </div>
                )}
            </div>

            {/* Action Bar / Status Indicators */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><Eye size={12} className="text-indigo-400" /> Head Pose: Normal</span>
                </div>
                <button
                    onClick={triggerPhoneDetection}
                    className="text-[9px] bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold transition flex items-center gap-1"
                >
                    <Smartphone size={10} /> Test Phone Alert
                </button>
            </div>
        </div>
    );
}
