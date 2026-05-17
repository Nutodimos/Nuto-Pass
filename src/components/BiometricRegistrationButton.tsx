"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, CheckCircle2, Trash2, XCircle, Wifi, MousePointerClick, ScanLine, CloudUpload, Sparkles, Check } from "lucide-react";
import { createPortal } from "react-dom";

const BiometricRegistrationButton = ({ studentId, hasBiometric = false }: { studentId: string, hasBiometric?: boolean }) => {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "initiating" | "waiting" | "success" | "error" | "deleting">("idle");
    const [slotId, setSlotId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [deviceStatus, setDeviceStatus] = useState<"online" | "idle" | "offline" | "loading">("loading");
    const [sensorStatus, setSensorStatus] = useState<boolean>(true);
    const [templateCount, setTemplateCount] = useState<number>(0);
    const [enrollStep, setEnrollStep] = useState<string>("");
    const router = useRouter();
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusPollRef = useRef<NodeJS.Timeout | null>(null);
    const hasEnteredRegRef = useRef<boolean>(false);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (statusPollRef.current) clearInterval(statusPollRef.current);
        };
    }, []);

    useEffect(() => {
        if (open) {
            checkDeviceStatus();
            statusPollRef.current = setInterval(checkDeviceStatus, 5000);
        } else {
            if (statusPollRef.current) clearInterval(statusPollRef.current);
        }
        return () => {
            if (statusPollRef.current) clearInterval(statusPollRef.current);
        };
    }, [open]);

    const checkDeviceStatus = async () => {
        try {
            const res = await fetch("/api/esp32/events");
            if (res.ok) {
                const data = await res.json();
                setDeviceStatus(data.device?.status || "offline");
                setSensorStatus(data.device?.sensorStatus ?? false);
                setTemplateCount(data.device?.templateCount ?? 0);
            }
        } catch (error) {
            setDeviceStatus("offline");
        }
    };

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
    const [enrollMsgIndex, setEnrollMsgIndex] = useState(0);

    const handleStart = async () => {
        setStatus("initiating");
        setEnrollStep("Connecting to biometric scanner...");
        setEnrollMsgIndex(0);

        try {
            const res = await fetch("/api/student/biometric/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });

            const data = await res.json();

            if (res.ok) {
                setSlotId(data.slotId);
                setStatus("waiting");
                setEnrollStep("Waiting for sensor to activate...");
                startPolling(data.slotId);
            } else {
                toast.error(data.message);
                setStatus("error");
                setEnrollStep("");
            }
        } catch (error) {
            toast.error("Failed to connect to server");
            setStatus("error");
            setEnrollStep("");
        }
    };

    const handleEmergencyWipe = async () => {
        if (!confirm("⚠️ WARNING: This will ERASE ALL fingerprints from the scanner memory and clear all student links. This cannot be undone. Proceed?")) return;
        
        setStatus("deleting");
        setEnrollStep("Sending wipe command...");
        try {
            const res = await fetch("/api/student/biometric/wipe", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Wipe command sent to device");
                router.refresh();
                setTimeout(() => {
                    handleClose();
                }, 2000);
            } else {
                toast.error(data.message || "Failed to initiate wipe");
                setStatus("idle");
            }
        } catch (error) {
            toast.error("Network error");
            setStatus("idle");
        }
    };

    const startPolling = (expectedSlot: number) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        hasEnteredRegRef.current = false;

        let pollCount = 0;
        const MAX_POLLS = 60;

        pollIntervalRef.current = setInterval(async () => {
            pollCount++;

            if (pollCount > MAX_POLLS) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setStatus("error");
                setEnrollStep("Registration timed out. Please try again.");
                toast.error("Registration timed out");
                return;
            }

            // Cycle through engaging messages during waiting
            if (!hasEnteredRegRef.current && pollCount > 1) {
                setEnrollMsgIndex(Math.min(0, enrollMessages.length - 1));
            }

            try {
                const res = await fetch("/api/esp32/events");
                if (!res.ok) return;
                const data = await res.json();
                const mode = data.device?.mode || "UNKNOWN";

                if (mode === "REGISTRATION") {
                    hasEnteredRegRef.current = true;
                    setEnrollMsgIndex(1); // "Place your finger now"
                    setEnrollStep("LED is purple — place your finger gently on the sensor");
                } else if (hasEnteredRegRef.current && (mode === "DEFAULT" || mode === "VERIFICATION")) {
                    setEnrollMsgIndex(3); // "Uploading to cloud"
                    setEnrollStep("Uploading fingerprint to cloud...");

                    const eventRes = await fetch(`/api/student/biometric/status?studentId=${studentId}`);
                    if (eventRes.ok) {
                        const eventData = await eventRes.json();
                        if (eventData.status === "SUCCESS") {
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            setEnrollMsgIndex(4);
                            setStatus("success");
                            setEnrollStep("");
                            toast.success("🎉 Fingerprint saved to cloud!");
                            router.refresh();
                            setTimeout(() => { setOpen(false); setStatus("idle"); }, 3000);
                        } else if (eventData.status === "FAILED") {
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            setStatus("error");
                            setEnrollStep("Scan failed — try pressing a bit firmer next time.");
                            toast.error("Registration failed");
                        }
                    }
                } else if (!hasEnteredRegRef.current) {
                    setEnrollStep("Waiting for sensor to wake up...");
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        }, 3000);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this student's biometric data? They will need to re-register.")) return;
        
        setStatus("deleting");
        try {
            const res = await fetch("/api/student/biometric/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId }),
            });

            if (res.ok) {
                toast.success("Biometric data deleted");
                router.refresh();
                handleClose();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to delete");
                setStatus("idle");
            }
        } catch (error) {
            toast.error("Network error");
            setStatus("idle");
        }
    };

    const handleClose = () => {
        setOpen(false);
        setStatus("idle");
        setEnrollStep("");
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-transform hover:scale-110 ${
                    hasBiometric ? "bg-emerald-500" : "bg-CPEGold"
                }`}
                title={hasBiometric ? "Biometric Registered (Click to edit)" : "Register Biometric ID"}
            >
                {hasBiometric ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Fingerprint className="w-4 h-4 text-white" />}
            </button>

            {mounted && open && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl overflow-hidden border border-slate-100">
                        {/* Header Background */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-CPENavy to-CPENavyDark rounded-t-2xl -z-10" />
                        
                        <button
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            onClick={handleClose}
                        >
                            ✕
                        </button>
                        
                        <div className="flex flex-col items-center mt-2 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg ${
                                status === "success" ? "bg-emerald-500" : 
                                status === "error" ? "bg-red-500" : "bg-white"
                            }`}>
                                {status === "success" ? (
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                ) : status === "error" ? (
                                    <XCircle className="w-8 h-8 text-white" />
                                ) : status === "deleting" ? (
                                    <Trash2 className="w-8 h-8 text-red-500 animate-pulse" />
                                ) : status === "waiting" || status === "initiating" ? (
                                    <Fingerprint className="w-8 h-8 text-CPENavy animate-pulse" />
                                ) : (
                                    <Fingerprint className="w-8 h-8 text-CPENavy" />
                                )}
                            </div>

                            <h2 className={`text-xl font-bold mb-2 ${status === "idle" ? "text-white" : "text-slate-800"}`}>
                                {status === "idle" ? "Biometric Settings" : "Remote Registration"}
                            </h2>

                            {/* Device Status Badge */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 border ${
                                deviceStatus === "online" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                                deviceStatus === "idle" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                deviceStatus === "loading" ? "bg-slate-100 border-slate-200 text-slate-500" :
                                "bg-red-500/10 border-red-500/20 text-red-600"
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    deviceStatus === "online" ? "bg-emerald-500 animate-pulse" :
                                    deviceStatus === "idle" ? "bg-amber-500" :
                                    deviceStatus === "loading" ? "bg-slate-400 animate-pulse" :
                                    "bg-red-500"
                                }`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Device {deviceStatus}
                                </span>
                            </div>

                            {/* Diagnostics Section (Only in IDLE) */}
                            {status === "idle" && deviceStatus !== "offline" && (
                                <div className="mt-1 mb-4 flex flex-col items-center gap-1 w-full">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-full justify-between">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Sensor Templates</span>
                                        <span className="text-xs font-bold text-CPENavy">{templateCount} / 127</span>
                                    </div>
                                    {!sensorStatus && (
                                        <div className="w-full px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] text-red-600 font-semibold uppercase">Scanner Disconnected</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {status === "idle" && hasBiometric && (
                                <div className="mt-2 w-full">
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4">
                                        <p className="text-sm text-emerald-700 font-medium">Student is already registered.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDelete}
                                            disabled={deviceStatus === "offline"}
                                            className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors border border-red-200 flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                        <button
                                            onClick={handleStart}
                                            disabled={deviceStatus === "offline" || !sensorStatus}
                                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all shadow-lg text-sm ${
                                                (deviceStatus === "offline" || !sensorStatus)
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                                : "bg-CPENavy hover:bg-CPENavyDark text-white shadow-CPENavy/30"
                                            }`}
                                        >
                                            Re-scan
                                        </button>
                                    </div>
                                </div>
                            )}

                            {status === "idle" && !hasBiometric && (
                                <div className="mt-2 w-full">
                                    <p className="text-sm text-slate-500 mb-6 px-4">
                                        Click below to wake up the biometric scanner. The device LED will turn <strong className="text-purple-600">purple</strong> when ready.
                                    </p>
                                    <button
                                        onClick={handleStart}
                                        disabled={deviceStatus === "offline" || !sensorStatus}
                                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all shadow-lg ${
                                            (deviceStatus === "offline" || !sensorStatus)
                                            ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                                            : "bg-CPENavy hover:bg-CPENavyDark text-white shadow-CPENavy/30"
                                        }`}
                                    >
                                        {deviceStatus === "offline" ? "Device Offline" : !sensorStatus ? "Scanner Missing" : "Start Registration"}
                                    </button>
                                </div>
                            )}

                            {/* EMERGENCY WIPE BUTTON (Only if templateCount > 0 and idle) */}
                            {status === "idle" && templateCount > 0 && (
                                <button
                                    onClick={handleEmergencyWipe}
                                    className="mt-6 text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 opacity-60 hover:opacity-100"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Emergency Wipe Sensor
                                </button>
                            )}

                            {status === "deleting" && (
                                <div className="mt-4">
                                    <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-600 font-medium">{enrollStep || "Processing..."}</p>
                                </div>
                            )}

                            {status === "initiating" && (
                                <div className="mt-4">
                                    <Loader2 className="w-6 h-6 text-CPENavy animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-600 font-medium">{enrollStep}</p>
                                </div>
                            )}

                            {status === "waiting" && (
                                <div className="mt-4">
                                    {/* Progress Steps */}
                                    <div className="flex justify-center gap-1 mb-4">
                                        {enrollMessages.map((msg, i) => (
                                            <div key={i} className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                                                i <= enrollMsgIndex ? "opacity-100" : "opacity-30"
                                            }`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                                                    i < enrollMsgIndex ? "bg-emerald-500 text-white scale-90" :
                                                    i === enrollMsgIndex ? "bg-purple-500 text-white scale-110 ring-4 ring-purple-200 animate-pulse" :
                                                    "bg-slate-200 text-slate-500"
                                                }`}>
                                                    {i < enrollMsgIndex ? <Check className="w-3.5 h-3.5" /> : enrollIcons[i]}
                                                </div>
                                                {i < enrollMessages.length - 1 && (
                                                    <div className={`w-0.5 h-2 rounded-full ${
                                                        i < enrollMsgIndex ? "bg-emerald-400" : "bg-slate-200"
                                                    }`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Current step message */}
                                    <p className="text-sm text-purple-600 font-semibold mb-2 min-h-[20px]">
                                        {enrollStep}
                                    </p>

                                    {/* Animated fingerprint */}
                                    <div className="relative w-16 h-16 mx-auto mb-3">
                                        <Fingerprint className="w-16 h-16 text-purple-300 animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping" />
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-400 mb-3 px-4">
                                        Keep your finger steady on the sensor. The LED will change color as each step completes.
                                    </p>

                                    <button
                                        onClick={handleClose}
                                        className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="mt-4">
                                    <p className="text-sm text-emerald-600 font-bold mb-1">
                                        Fingerprint Saved!
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Student is now securely linked.
                                    </p>
                                </div>
                            )}

                            {status === "error" && (
                                <div className="mt-4">
                                    <p className="text-sm text-red-600 font-bold mb-1 px-4">
                                        {enrollStep || "Registration failed"}
                                    </p>
                                    <button
                                        onClick={() => { setStatus("idle"); setEnrollStep(""); }}
                                        className="mt-4 py-2 px-6 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
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

export default BiometricRegistrationButton;
