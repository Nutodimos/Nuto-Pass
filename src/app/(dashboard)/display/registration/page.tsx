"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GraduationCap, Phone, Hash, ChevronRight, Fingerprint, CheckCircle2, Loader2, Check, Wifi, MousePointerClick, ScanLine, CloudUpload, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";

// Mock Data
const MOCK_STUDENTS = [
    { id: "1", name: "John", surname: "Doe", username: "CPE/2019/001", class: { name: "400L" }, phone: "08012345678", img: null, hasBiometric: false },
    { id: "2", name: "Jane", surname: "Smith", username: "CPE/2019/002", class: { name: "400L" }, phone: "08087654321", img: null, hasBiometric: true },
];

const MockBiometricRegistrationButton = ({ student, hasBiometric = false }: any) => {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "initiating" | "waiting" | "success">("idle");
    const [enrollStep, setEnrollStep] = useState<string>("");
    const [enrollMsgIndex, setEnrollMsgIndex] = useState(0);

    const enrollIcons = [
        <Wifi key="wifi" className="w-3.5 h-3.5" />,
        <MousePointerClick key="click" className="w-3.5 h-3.5" />,
        <ScanLine key="scan" className="w-3.5 h-3.5" />,
        <CloudUpload key="cloud" className="w-3.5 h-3.5" />,
        <Sparkles key="sparkle" className="w-3.5 h-3.5" />,
    ];
    const enrollMessages = [
        "Waking up biometric sensor...",
        "Sensor ready — place your finger now",
        "Hold still — scanning fingerprint...",
        "Uploading scan to cloud...",
        "Almost done — verifying quality...",
    ];

    const handleStart = () => {
        setStatus("initiating");
        setEnrollStep("Connecting to biometric scanner...");
        
        // Simulate network delay
        setTimeout(() => {
            setStatus("waiting");
            setEnrollStep("Waiting for sensor to activate...");
            
            // Cycle through steps
            let step = 0;
            const interval = setInterval(() => {
                step++;
                if (step === 1) {
                    setEnrollMsgIndex(1);
                    setEnrollStep("Place your finger gently on the sensor (Scan 1 of 2)");
                } else if (step === 3) {
                    setEnrollMsgIndex(2);
                    setEnrollStep("Follow the sensor LED instructions (Scan 2 of 2)");
                } else if (step === 5) {
                    setEnrollMsgIndex(4);
                    setStatus("success");
                    setEnrollStep("");
                    clearInterval(interval);
                }
            }, 2000);
        }, 1500);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110 ${
                    hasBiometric ? "bg-emerald-500" : "bg-CPEGold"
                }`}
            >
                {hasBiometric ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Fingerprint className="w-4 h-4 text-white" />}
            </button>

            {open && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl overflow-hidden border border-slate-100">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-t-2xl -z-10" />
                        
                        <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setOpen(false)}>✕</button>
                        
                        <div className="flex flex-col items-center mt-2 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg ${
                                status === "success" ? "bg-emerald-500" : "bg-white"
                            }`}>
                                {status === "success" ? (
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                ) : (
                                    <Fingerprint className={`w-8 h-8 text-indigo-900 ${status === "waiting" || status === "initiating" ? "animate-pulse" : ""}`} />
                                )}
                            </div>

                            <h2 className={`text-xl font-bold mb-2 ${status === "idle" ? "text-white" : "text-slate-800"}`}>
                                {status === "idle" ? "Biometric Settings" : "Remote Registration"}
                            </h2>

                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Device online</span>
                            </div>

                            {status === "idle" && (
                                <div className="mt-2 w-full">
                                    <p className="text-sm text-slate-500 mb-6 px-4">
                                        Click below to wake up the biometric scanner. The device LED will turn <strong className="text-purple-600">purple</strong> when ready.
                                    </p>
                                    <button
                                        onClick={handleStart}
                                        className="w-full py-3 px-4 rounded-xl font-semibold transition-all shadow-lg bg-indigo-900 text-white"
                                    >
                                        Start Registration
                                    </button>
                                </div>
                            )}

                            {status === "initiating" && (
                                <div className="mt-4">
                                    <Loader2 className="w-6 h-6 text-indigo-900 animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-600 font-medium">{enrollStep}</p>
                                </div>
                            )}

                            {status === "waiting" && (
                                <div className="mt-4">
                                    <div className="flex justify-center gap-1 mb-4">
                                        {enrollMessages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col items-center gap-1 transition-all duration-300 ${i <= enrollMsgIndex ? "opacity-100" : "opacity-30"}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                    i < enrollMsgIndex ? "bg-emerald-500 text-white scale-90" :
                                                    i === enrollMsgIndex ? "bg-purple-500 text-white scale-110 ring-4 ring-purple-200 animate-pulse" :
                                                    "bg-slate-200 text-slate-500"
                                                }`}>
                                                    {i < enrollMsgIndex ? <Check className="w-3.5 h-3.5" /> : enrollIcons[i]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-purple-600 font-semibold mb-2 min-h-[20px]">{enrollStep}</p>
                                    <div className="relative w-16 h-16 mx-auto mb-3">
                                        <Fingerprint className="w-16 h-16 text-purple-300 animate-pulse" />
                                    </div>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="mt-4">
                                    <p className="text-sm text-emerald-600 font-bold mb-1">Fingerprint Saved!</p>
                                    <p className="text-xs text-slate-500">Student is now securely linked.</p>
                                    <button onClick={() => setOpen(false)} className="mt-4 py-2 px-6 bg-slate-100 rounded-xl text-sm font-semibold">Close</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default function RegistrationDisplay() {
    return (
        <div className="flex-1 p-4 flex flex-col gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-white text-center md:text-left">
                            <h1 className="text-2xl font-bold">Students (Display Mock)</h1>
                            <p className="text-white/80 text-sm">Click the fingerprint icon to show registration process</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {MOCK_STUDENTS.map((student) => (
                    <div key={student.id} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center gap-4">
                            <div className="relative">
                                <Image src="/noAvatar.png" alt={student.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-800 truncate">{student.name}</h3>
                                <p className="text-sm text-gray-500">{student.surname}</p>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                    <Hash className="w-4 h-4 text-indigo-900" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-400">Matric No.</p>
                                    <p className="text-gray-700 font-medium truncate">{student.username}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 relative z-10">
                            <MockBiometricRegistrationButton student={student} hasBiometric={student.hasBiometric} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
