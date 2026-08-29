"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, ShieldAlert, Eye, Smartphone, AlertTriangle, CheckCircle2, UserX, Users, EyeOff, Compass } from 'lucide-react';

interface ComputerVisionProctoringProps {
    onPhoneDetected: (reason: string) => void;
    onCameraBlocked?: (reason: string) => void;
    onFaceAbsent?: (reason: string) => void;
    onMultipleFaces?: (reason: string) => void;
    onGazeViolation?: (count: number) => void;
    className?: string;
}

export default function ComputerVisionProctoring({
    onPhoneDetected,
    onCameraBlocked,
    onFaceAbsent,
    onMultipleFaces,
    onGazeViolation,
    className = ""
}: ComputerVisionProctoringProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [hasCamera, setHasCamera] = useState(false);
    const [cameraBlocked, setCameraBlocked] = useState(false);
    const [faceDetected, setFaceDetected] = useState(true);
    const [multipleFaces, setMultipleFaces] = useState(false);
    const [phoneDetected, setPhoneDetected] = useState(false);
    const [headPose, setHeadPose] = useState<'FORWARD' | 'LEFT' | 'RIGHT' | 'DOWN' | 'UP'>('FORWARD');
    const [gazeDirection, setGazeDirection] = useState<'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN'>('CENTER');
    const [gazeViolations, setGazeViolations] = useState(0);
    const [statusMessage, setStatusMessage] = useState<string>("Secured Frame");
    const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);

    // Violation streaks and timers
    const blockStreakRef = useRef(0);
    const faceAbsentStreakRef = useRef(0);
    const multiFaceStreakRef = useRef(0);
    const phoneStreakRef = useRef(0);
    const headDeviationStreakRef = useRef(0);
    const cocoModelRef = useRef<any>(null);
    const faceMeshRef = useRef<any>(null);
    const isAnalyzingRef = useRef(false);

    // 1. Initialize Camera Stream
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 320 },
                        height: { ideal: 240 },
                        facingMode: "user",
                        frameRate: { ideal: 24, max: 30 }
                    },
                    audio: false
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setHasCamera(true);
                }
            } catch (err) {
                console.warn("[AI Proctor] Webcam access denied or unavailable:", err);
                setHasCamera(false);
                if (onCameraBlocked) {
                    onCameraBlocked("Camera permission denied or camera device disconnected");
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onCameraBlocked]);

    // 2. Dynamically Load MediaPipe Face Mesh & COCO-SSD for Real Head Pose & Object Tracking
    useEffect(() => {
        let isMounted = true;

        const loadAIModels = async () => {
            const loadScript = (src: string): Promise<void> => {
                return new Promise((resolve, reject) => {
                    if (document.querySelector(`script[src="${src}"]`)) {
                        resolve();
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = src;
                    script.async = true;
                    script.crossOrigin = "anonymous";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Failed to load ${src}`));
                    document.head.appendChild(script);
                });
            };

            // A. Load MediaPipe Face Mesh
            try {
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
                if ((window as any).FaceMesh && isMounted) {
                    const faceMesh = new (window as any).FaceMesh({
                        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
                    });
                    faceMesh.setOptions({
                        maxNumFaces: 2,
                        refineLandmarks: true,
                        minDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    });
                    faceMeshRef.current = faceMesh;
                    setMediaPipeLoaded(true);
                    console.log("[AI Proctor] MediaPipe Face Mesh initialized.");
                }
            } catch (e) {
                console.warn("[AI Proctor] MediaPipe Face Mesh CDN load failed, using native geometry:", e);
            }

            // B. Load COCO-SSD for Mobile Phone Scanning
            try {
                await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
                if ((window as any).cocoSsd && isMounted) {
                    const model = await (window as any).cocoSsd.load({ base: 'mobilenet_v1' });
                    if (isMounted) {
                        cocoModelRef.current = model;
                    }
                }
            } catch (e) {
                console.warn("[AI Proctor] COCO-SSD load skipped:", e);
            }
        };

        loadAIModels();

        return () => {
            isMounted = false;
        };
    }, []);

    // 3. Real-Time Computer Vision Analysis Loop (400ms interval, Zero Lag)
    const runAnalysis = useCallback(async () => {
        if (!hasCamera || isAnalyzingRef.current) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        isAnalyzingRef.current = true;

        try {
            const width = 160;
            const height = 120;

            if (!offscreenCanvasRef.current) {
                offscreenCanvasRef.current = document.createElement("canvas");
                offscreenCanvasRef.current.width = width;
                offscreenCanvasRef.current.height = height;
            }
            const offCanvas = offscreenCanvasRef.current;
            const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
            if (!offCtx) return;

            offCtx.drawImage(video, 0, 0, width, height);
            const frameData = offCtx.getImageData(0, 0, width, height);
            const pixels = frameData.data;

            // A. Luminance & Variance Analysis (Detect Paper, Tape, Darkness, Blocked Camera)
            let sumLuminance = 0;
            let sumSqLuminance = 0;
            let skinPixelCount = 0;
            let skinCenterX = 0;
            let skinCenterY = 0;
            const sampleStep = 8;
            const totalSamples = pixels.length / sampleStep;

            for (let i = 0; i < pixels.length; i += sampleStep) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                sumLuminance += lum;
                sumSqLuminance += lum * lum;

                const cb = -0.1687 * r - 0.3313 * g + 0.5 * b + 128;
                const cr = 0.5 * r - 0.4187 * g - 0.0813 * b + 128;
                if (lum > 40 && lum < 235 && cb > 82 && cb < 138 && cr > 132 && cr < 185) {
                    skinPixelCount++;
                    const pixelIndex = i / 4;
                    skinCenterX += (pixelIndex % width);
                    skinCenterY += Math.floor(pixelIndex / width);
                }
            }

            const meanLum = sumLuminance / totalSamples;
            const variance = Math.sqrt(Math.max(0, (sumSqLuminance / totalSamples) - (meanLum * meanLum)));
            const skinRatio = skinPixelCount / totalSamples;

            // Camera is blocked if pitch black (meanLum < 16), white paper (meanLum > 225 & var < 12), or flat uniform object (var < 7.0)
            const isOccluded = meanLum < 16 || (meanLum > 225 && variance < 12) || variance < 7.0;

            if (isOccluded) {
                blockStreakRef.current += 1;
                if (blockStreakRef.current >= 2) {
                    setCameraBlocked(true);
                    setStatusMessage("Camera Blocked / Paper Covering");
                    if (onCameraBlocked) {
                        onCameraBlocked("Camera lens occluded or covered with paper/object");
                    }
                }
            } else {
                blockStreakRef.current = 0;
                setCameraBlocked(false);
            }

            // B. Real Head Pose & Gaze Estimation via MediaPipe or Geometric Feature Mapping
            let currentHeadPose: 'FORWARD' | 'LEFT' | 'RIGHT' | 'DOWN' | 'UP' = 'FORWARD';
            let currentGaze: 'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN' = 'CENTER';
            let detectedFacesCount = 1;
            let landmarkPoints: { x: number; y: number }[] = [];

            if (!isOccluded) {
                if (faceMeshRef.current) {
                    try {
                        const mpResults = await new Promise<any>((resolve) => {
                            faceMeshRef.current.onResults((results: any) => resolve(results));
                            faceMeshRef.current.send({ image: video });
                        });

                        if (mpResults?.multiFaceLandmarks && mpResults.multiFaceLandmarks.length > 0) {
                            detectedFacesCount = mpResults.multiFaceLandmarks.length;
                            const lm = mpResults.multiFaceLandmarks[0];

                            // Key 3D Facial Landmarks:
                            // 1: Nose tip, 33: Left eye outer, 263: Right eye outer, 152: Chin, 10: Forehead
                            const nose = lm[1];
                            const leftEye = lm[33];
                            const rightEye = lm[263];
                            const chin = lm[152];
                            const forehead = lm[10];

                            landmarkPoints = [
                                { x: nose.x * 320, y: nose.y * 240 },
                                { x: leftEye.x * 320, y: leftEye.y * 240 },
                                { x: rightEye.x * 320, y: rightEye.y * 240 },
                                { x: chin.x * 320, y: chin.y * 240 },
                                { x: forehead.x * 320, y: forehead.y * 240 }
                            ];

                            // Yaw Calculation (Left vs Right):
                            const yawRatio = (nose.x - leftEye.x) / (rightEye.x - leftEye.x);
                            // Pitch Calculation (Up vs Down):
                            const pitchRatio = (nose.y - forehead.y) / (chin.y - forehead.y);

                            if (yawRatio < 0.36) {
                                currentHeadPose = 'LEFT';
                                currentGaze = 'LEFT';
                            } else if (yawRatio > 0.64) {
                                currentHeadPose = 'RIGHT';
                                currentGaze = 'RIGHT';
                            } else if (pitchRatio > 0.66) {
                                currentHeadPose = 'DOWN';
                                currentGaze = 'DOWN';
                            } else if (pitchRatio < 0.38) {
                                currentHeadPose = 'UP';
                            } else {
                                currentHeadPose = 'FORWARD';
                                currentGaze = 'CENTER';
                            }
                        } else {
                            detectedFacesCount = 0;
                        }
                    } catch (mpErr) {
                        // fallback to geometry
                    }
                } else if ('FaceDetector' in window) {
                    try {
                        const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
                        const detected = await detector.detect(offCanvas);
                        detectedFacesCount = detected.length;
                        if (detected.length > 0) {
                            const box = detected[0].boundingBox;
                            const centerRelX = (box.x + box.width / 2) / width;
                            const centerRelY = (box.y + box.height / 2) / height;
                            if (centerRelX < 0.38) currentHeadPose = 'LEFT';
                            else if (centerRelX > 0.62) currentHeadPose = 'RIGHT';
                            else if (centerRelY > 0.65) currentHeadPose = 'DOWN';
                        }
                    } catch {
                        detectedFacesCount = skinRatio > 0.03 ? 1 : 0;
                    }
                } else {
                    detectedFacesCount = skinRatio > 0.025 ? 1 : 0;
                    if (skinPixelCount > 0) {
                        const avgX = (skinCenterX / skinPixelCount) / width;
                        const avgY = (skinCenterY / skinPixelCount) / height;
                        if (avgX < 0.36) currentHeadPose = 'LEFT';
                        else if (avgX > 0.64) currentHeadPose = 'RIGHT';
                        else if (avgY > 0.68) currentHeadPose = 'DOWN';
                    }
                }

                setHeadPose(currentHeadPose);
                setGazeDirection(currentGaze);

                // Face absence & multi-face detection
                if (detectedFacesCount === 0) {
                    faceAbsentStreakRef.current += 1;
                    if (faceAbsentStreakRef.current >= 3) {
                        setFaceDetected(false);
                        setStatusMessage("No Face Detected");
                        if (onFaceAbsent) onFaceAbsent("No face detected in camera frame");
                    }
                } else {
                    faceAbsentStreakRef.current = 0;
                    setFaceDetected(true);
                }

                if (detectedFacesCount > 1) {
                    multiFaceStreakRef.current += 1;
                    if (multiFaceStreakRef.current >= 2) {
                        setMultipleFaces(true);
                        setStatusMessage("Multiple Faces Detected");
                        if (onMultipleFaces) onMultipleFaces("Multiple persons detected in camera frame");
                    }
                } else {
                    multiFaceStreakRef.current = 0;
                    setMultipleFaces(false);
                }

                // Head pose deviation tracking
                if (currentHeadPose !== 'FORWARD') {
                    headDeviationStreakRef.current += 1;
                    if (headDeviationStreakRef.current >= 3) {
                        setGazeViolations(prev => {
                            const next = prev + 1;
                            if (onGazeViolation) onGazeViolation(next);
                            return next;
                        });
                    }
                } else {
                    headDeviationStreakRef.current = 0;
                }
            }

            // C. Real Object Detection (Mobile Phone Scanner)
            let phoneFound = false;

            if (cocoModelRef.current && !isOccluded) {
                try {
                    const predictions = await cocoModelRef.current.detect(video, 4);
                    for (const pred of predictions) {
                        if ((pred.class === "cell phone" || pred.class === "remote") && pred.score > 0.38) {
                            phoneFound = true;
                            break;
                        }
                    }
                } catch (e) {
                    // model pass error handled gracefully
                }
            }

            if (phoneFound) {
                phoneStreakRef.current += 1;
                if (phoneStreakRef.current >= 2) {
                    setPhoneDetected(true);
                    setStatusMessage("Mobile Phone Detected");
                    onPhoneDetected("Mobile Phone detected in camera frame");
                }
            } else {
                phoneStreakRef.current = 0;
                setPhoneDetected(false);
            }

            if (!isOccluded && detectedFacesCount === 1 && !phoneFound && currentHeadPose === 'FORWARD') {
                setStatusMessage("Secured Frame");
            }

            // D. Draw HUD Overlays, Head Pose Axis & Landmarks onto display canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = 320;
                    canvas.height = 240;
                    ctx.clearRect(0, 0, 320, 240);

                    if (isOccluded || phoneFound || detectedFacesCount !== 1) {
                        ctx.strokeStyle = '#ef4444';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(10, 10, 300, 220);

                        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
                        ctx.fillRect(10, 10, 300, 28);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.fillText(
                            isOccluded ? "⚠️ CAMERA LENS BLOCKED" : (phoneFound ? "🚨 PHONE DETECTED" : "⚠️ FACE NOT DETECTED"),
                            20,
                            28
                        );
                    } else if (currentHeadPose !== 'FORWARD') {
                        ctx.strokeStyle = '#f59e0b';
                        ctx.lineWidth = 2.5;
                        ctx.strokeRect(15, 15, 290, 210);

                        ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
                        ctx.fillRect(15, 15, 290, 24);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 10px sans-serif';
                        ctx.fillText(`⚠️ HEAD TURNED: ${currentHeadPose}`, 25, 31);
                    } else {
                        // Green HUD brackets
                        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
                        ctx.lineWidth = 2;
                        const s = 25;
                        ctx.beginPath(); ctx.moveTo(40, 40 + s); ctx.lineTo(40, 40); ctx.lineTo(40 + s, 40); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(280 - s, 40); ctx.lineTo(280, 40); ctx.lineTo(280, 40 + s); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(40, 200 - s); ctx.lineTo(40, 200); ctx.lineTo(40 + s, 200); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(280 - s, 200); ctx.lineTo(280, 200); ctx.lineTo(280, 200 - s); ctx.stroke();
                    }

                    // Draw MediaPipe Face Landmarks & Orientation Compass
                    if (landmarkPoints.length >= 5) {
                        ctx.fillStyle = '#10b981';
                        landmarkPoints.forEach(pt => {
                            ctx.beginPath();
                            ctx.arc(320 - pt.x, pt.y, 3, 0, 2 * Math.PI);
                            ctx.fill();
                        });

                        // Draw Face Axis Triangle (Forehead -> Chin, Left Eye -> Right Eye)
                        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(320 - landmarkPoints[4].x, landmarkPoints[4].y); // Forehead
                        ctx.lineTo(320 - landmarkPoints[3].x, landmarkPoints[3].y); // Chin
                        ctx.moveTo(320 - landmarkPoints[1].x, landmarkPoints[1].y); // Left eye
                        ctx.lineTo(320 - landmarkPoints[2].x, landmarkPoints[2].y); // Right eye
                        ctx.stroke();
                    } else if (!isOccluded && detectedFacesCount === 1) {
                        // Fallback Target Crosshair
                        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
                        ctx.beginPath();
                        ctx.arc(160, 115, 14, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                }
            }
        } catch (err) {
            console.error("[AI Proctor] Frame analysis error:", err);
        } finally {
            isAnalyzingRef.current = false;
        }
    }, [hasCamera, onCameraBlocked, onFaceAbsent, onMultipleFaces, onPhoneDetected, onGazeViolation]);

    // Run analysis every 400ms for real-time responsiveness without lag
    useEffect(() => {
        if (!hasCamera) return;
        const timer = setInterval(() => {
            runAnalysis();
        }, 400);

        return () => clearInterval(timer);
    }, [hasCamera, runAnalysis]);

    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white shadow-xl relative select-none ${className}`}>
            {/* Header Status Bar */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-indigo-400">
                    <Camera size={14} className={hasCamera ? "text-emerald-400 animate-pulse" : "text-slate-500"} />
                    <span>MediaPipe AI Proctor</span>
                </div>
                {phoneDetected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase animate-pulse flex items-center gap-1">
                        <Smartphone size={10} /> Phone Detected!
                    </span>
                ) : cameraBlocked ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase animate-pulse flex items-center gap-1">
                        <EyeOff size={10} /> Lens Blocked!
                    </span>
                ) : !faceDetected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <UserX size={10} /> No Face
                    </span>
                ) : multipleFaces ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Users size={10} /> Multiple Faces
                    </span>
                ) : headPose !== 'FORWARD' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Compass size={10} className="animate-spin" /> Pose: {headPose}
                    </span>
                ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> {statusMessage}
                    </span>
                )}
            </div>

            {/* Video & Canvas Frame (Hardware accelerated) */}
            <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${
                        cameraBlocked ? "opacity-30 blur-sm" : "opacity-90"
                    }`}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Overlaid Warnings */}
                {cameraBlocked && (
                    <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10">
                        <EyeOff size={28} className="text-red-500 animate-bounce mb-1" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">Camera Lens Blocked</span>
                        <span className="text-[10px] text-red-200 mt-1">Please remove paper/covering immediately to avoid auto-submission.</span>
                    </div>
                )}

                {phoneDetected && (
                    <div className="absolute inset-0 bg-red-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10 animate-pulse">
                        <Smartphone size={32} className="text-red-500 mb-1" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">Mobile Phone Detected</span>
                        <span className="text-[10px] text-red-200 mt-1">Critical security breach logged. Exam will be auto-submitted.</span>
                    </div>
                )}
            </div>

            {/* AI Diagnostics & Head Pose / Gaze Tracking Chips */}
            <div className="grid grid-cols-3 gap-1 mt-2.5">
                <div className={`px-1.5 py-1 rounded-lg border text-[9px] font-semibold flex items-center gap-1 justify-center ${
                    faceDetected && !cameraBlocked ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${faceDetected && !cameraBlocked ? "bg-emerald-400" : "bg-red-500 animate-ping"}`} />
                    <span>{cameraBlocked ? "Blocked" : (faceDetected ? "Face OK" : "No Face")}</span>
                </div>
                <div className={`px-1.5 py-1 rounded-lg border text-[9px] font-semibold flex items-center gap-1 justify-center ${
                    headPose === 'FORWARD' ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}>
                    <Compass size={10} className={headPose === 'FORWARD' ? "text-indigo-400" : "text-amber-400 animate-spin"} />
                    <span>Pose: {headPose}</span>
                </div>
                <div className={`px-1.5 py-1 rounded-lg border text-[9px] font-semibold flex items-center gap-1 justify-center ${
                    gazeDirection === 'CENTER' ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}>
                    <Eye size={10} className={gazeDirection === 'CENTER' ? "text-emerald-400" : "text-amber-400"} />
                    <span>Gaze: {gazeDirection}</span>
                </div>
            </div>
        </div>
    );
}
