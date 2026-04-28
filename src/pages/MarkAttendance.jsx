import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Camera, ScanLine, Check, AlertTriangle, Loader2, Save, Info } from 'lucide-react';

const MarkAttendance = () => {
    const videoRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Initializing...");
    const [modelsLoaded, setModelsLoaded] = useState(false);


    useEffect(() => {
        const init = async () => {
            try {
                const MODEL_URL = "/models";

                setMessage("Loading models...");

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);

                setModelsLoaded(true);
                setMessage("Starting camera...");

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // ✅ WAIT FOR VIDEO TO LOAD (IMPORTANT FIX)
                    await new Promise((resolve) => {
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current.play();
                            resolve();
                        };
                    });
                }

                setLoading(false);
                setMessage("Ready ✅");

            } catch (err) {
                console.error(err);
                setMessage("Error initializing ❌");
            }
        };

        init();
    }, []);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    };


    const handleCaptureAndMark = async () => {
        try {
            if (!modelsLoaded) {
                setMessage("Models not loaded ❌");
                return;
            }

            if (!videoRef.current || videoRef.current.readyState !== 4) {
                setMessage("Camera not ready ❌");
                return;
            }

            setMessage("Detecting face...");

            const detection = await faceapi
                .detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setMessage("No face detected ❌");
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            console.log("Desc kength", descriptor.length)

            setMessage("Matching & marking attendance...");

            const res = await fetch("http://localhost:3000/api/attendance", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    descriptor,
                    subject: "Math",
                    studentClass: "ten",
                }),
            });

            const data = await res.json();

            if (!data.success) {
                if (data.message === "Already marked today" && data.student) {
                    setMessage(`⚠️ ${data.student} - Already Marked`);
                } else {
                    setMessage(`❌ ${data.message || "Verification Failed"}`);
                }
            } else {
                const text = data.student ? `${data.student} - ${data.message}` : data.message;
                setMessage(`✅ ${text}`);
            }

        } catch (err) {
            console.error(err);
            setMessage("❌ Server error");
        }
    };

    const handleSaveAttendance = async () => {
        try {
            setMessage("Saving attendance...");
            stopCamera();
            const res = await fetch("http://localhost:3000/api/attendance/save", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sClass: "10",
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setMessage(`❌ ${data.message || "Failed to save attendance"}`);
            } else {
                setMessage(`✅ ${data.message || "Attendance saved successfully"}`);
            }
        } catch (err) {
            console.error(err.message);
            setMessage("❌ Server error");
        }
    };


    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 hidden sm:block">
                        <ScanLine size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Attendance Scanner</h2>
                        <p className="text-xs text-slate-500">Position face to mark attendance</p>
                    </div>
                </div>
                <button onClick={handleSaveAttendance} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow-md shadow-emerald-200 transition-colors text-sm sm:text-base whitespace-nowrap">
                    <Save size={18} /> <span className="hidden sm:inline">Save Day's Attendance</span>
                </button>
            </div>

            <div className="flex-1 bg-slate-900 relative flex flex-col rounded-b-2xl shadow-xl overflow-hidden min-h-[400px]">
                {/* Camera Viewport */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ display: loading ? "none" : "block" }}
                    />

                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                            <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                            <div className="text-slate-300 font-medium tracking-widest animate-pulse">{message.toUpperCase()}</div>
                        </div>
                    )}

                    {!loading && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-64 h-64 sm:w-80 sm:h-80 border-2 border-white/30 rounded-3xl relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>

                                    {/* Scanning Laser Animation */}
                                    {(message === "Detecting face..." || message === "Matching & marking attendance...") && (
                                        <div className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-[scan_2s_ease-in-out_infinite]"></div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-12 w-full text-center">
                                <span className="inline-block px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white/90 text-xs sm:text-sm font-mono tracking-wider shadow-lg">
                                    POSITION FACE WITHIN FRAME
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Result Overlays */}
                    {message.includes("✅") && !message.includes("Ready") && (
                        <div className="absolute inset-0 z-20 bg-emerald-900/90 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                            <div className="p-4 bg-white rounded-full mb-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                                <Check size={48} className="text-emerald-600" />
                            </div>
                            <h2 className="text-white font-bold text-2xl tracking-wide text-center">ACCESS GRANTED</h2>
                            <p className="text-emerald-100 text-lg uppercase tracking-wider mt-2 font-medium bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm shadow-inner">
                                {message.replace("✅ ", "")}
                            </p>
                        </div>
                    )}

                    {message.includes("⚠️") && (
                        <div className="absolute inset-0 z-20 bg-amber-900/90 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                            <div className="p-4 bg-white rounded-full mb-4 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                                <Info size={48} className="text-amber-500" />
                            </div>
                            <h2 className="text-white font-bold text-2xl tracking-wide text-center">ALREADY MARKED</h2>
                            <p className="text-amber-100 text-lg uppercase tracking-wider mt-2 font-medium bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm shadow-inner text-center">
                                {message.replace("⚠️ ", "")}
                            </p>
                        </div>
                    )}

                    {message.includes("❌") && !message.includes("loaded") && !message.includes("error") && !message.includes("ready") && (
                        <div className="absolute inset-0 z-20 bg-red-900/90 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                            <div className="p-4 bg-white rounded-full mb-4 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                                <AlertTriangle size={48} className="text-red-600" />
                            </div>
                            <h2 className="text-white font-bold text-2xl tracking-wide text-center">VERIFICATION FAILED</h2>
                            <p className="text-red-100 text-lg uppercase tracking-wider mt-2 font-medium bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm shadow-inner text-center">
                                {message.replace("❌ ", "")}
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="p-4 sm:p-6 bg-white border-t border-slate-200 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto w-full">

                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg w-full sm:w-auto overflow-hidden">
                            <Info size={18} className="text-blue-500 shrink-0" />
                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">Subj: <strong className="text-slate-800">Math</strong> | Class: <strong className="text-slate-800">10</strong></span>
                        </div>

                        <button
                            onClick={() => {
                                if ((message.includes("✅") || message.includes("❌") || message.includes("⚠️")) && !message.includes("Ready")) {
                                    setMessage("Ready ✅");
                                } else {
                                    handleCaptureAndMark();
                                }
                            }}
                            disabled={loading || !modelsLoaded || message === "Detecting face..." || message === "Matching & marking attendance..." || message === "Saving attendance..."}
                            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all duration-200 ${(message.includes("✅") || message.includes("❌") || message.includes("⚠️")) && !message.includes("Ready")
                                ? "bg-slate-800 hover:bg-slate-900 text-white ring-4 ring-slate-200 shadow-slate-300"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-0.5"
                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            <Camera size={20} className={message === "Detecting face..." || message === "Matching & marking attendance..." || message === "Saving attendance..." ? "animate-pulse" : ""} />
                            {message === "Detecting face..." || message === "Matching & marking attendance..."
                                ? 'Processing Biometrics...'
                                : message === "Saving attendance..." ? 'Saving & Closing...'
                                    : ((message.includes("✅") || message.includes("❌") || message.includes("⚠️")) && !message.includes("Ready") ? 'Scan Next Student' : 'Capture & Verify')
                            }
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkAttendance;