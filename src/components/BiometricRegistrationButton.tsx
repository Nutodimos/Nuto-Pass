"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, CheckCircle2, Trash2, XCircle } from "lucide-react";
import { createPortal } from "react-dom";

const BiometricRegistrationButton = ({ studentId, hasBiometric = false }: { studentId: string, hasBiometric?: boolean }) => {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "initiating" | "waiting" | "success" | "error" | "deleting">("idle");
    const [slotId, setSlotId] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [deviceStatus, setDeviceStatus] = useState<"online" | "idle" | "offline" | "loading">("loading");
    const [sensorStatus, setSensorStatus] = useState<boolean>(true);
    const [enrollStep, setEnrollStep] = useState<string>("");
    const router = useRouter();
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusPollRef = useRef<NodeJS.Timeout | null>(null);

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
            }
        } catch (error) {
            setDeviceStatus("offline");
        }
    };

    const handleStart = async () => {
        setStatus("initiating");
        setEnrollStep("Sending command to device...");

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
                setEnrollStep("Waiting for device to enter registration mode...");
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

    const startPolling = (expectedSlot: number) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        let pollCount = 0;
        const MAX_POLLS = 60; // 60 * 3s = 3 minutes max

        pollIntervalRef.current = setInterval(async () => {
            pollCount++;

            if (pollCount > MAX_POLLS) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setStatus("error");
                setEnrollStep("Registration timed out. Please try again.");
                toast.error("Registration timed out");
                return;
            }

            try {
                const res = await fetch("/api/esp32/events");
                if (!res.ok) return;
                const data = await res.json();
                const mode = data.device?.mode || "UNKNOWN";

                // Track what the device is doing via its reported mode
                if (mode === "REGISTRATION") {
                    setEnrollStep("Device ready — place finger on the sensor...");
                } else if (mode === "DEFAULT" || mode === "VERIFICATION") {
                    // Device has left registration mode — check if it was success or failure.
                    // We need to check the latest ESP32 event to know the result.
                    const eventRes = await fetch(`/api/student/biometric/status?studentId=${studentId}`);
                    if (eventRes.ok) {
                        const eventData = await eventRes.json();
                        if (eventData.status === "SUCCESS") {
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            setStatus("success");
                            setEnrollStep("");
                            toast.success("Biometric registration complete!");
                            router.refresh();
                            setTimeout(() => { setOpen(false); setStatus("idle"); }, 3000);
                        } else if (eventData.status === "FAILED") {
                            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                            setStatus("error");
                            setEnrollStep("Registration failed — the sensor could not match your prints. Try again.");
                            toast.error("Registration failed on device");
                        }
                        // If status is "PENDING", device just hasn't reported yet — keep polling
                    }
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
                                Remote Registration
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

                            {/* Sensor Status Warning */}
                            {deviceStatus !== "offline" && !sensorStatus && (
                                <div className="mt-1 mb-3 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] text-red-600 font-semibold uppercase">Scanner Disconnected</span>
                                </div>
                            )}

                            {status === "idle" && hasBiometric && (
                                <div className="mt-4 w-full">
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-4">
                                        <p className="text-sm text-emerald-700 font-medium">Student is already registered.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDelete}
                                            disabled={deviceStatus === "offline"}
                                            className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors border border-red-200 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                        <button
                                            onClick={handleStart}
                                            disabled={deviceStatus === "offline" || !sensorStatus}
                                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all shadow-lg ${
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
                                <div className="mt-4">
                                    <p className="text-sm text-slate-500 mb-6">
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
                                        {deviceStatus === "offline" ? "Device Offline" : !sensorStatus ? "Scanner Missing" : "Wake Device"}
                                    </button>
                                </div>
                            )}

                            {status === "deleting" && (
                                <div className="mt-4">
                                    <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-slate-600 font-medium">Removing biometric data...</p>
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
                                    <p className="text-sm text-slate-600 font-medium mb-1">
                                        Scanner is ready (Slot {slotId})
                                    </p>
                                    <p className="text-xs text-purple-600 font-semibold mb-2">
                                        {enrollStep}
                                    </p>
                                    <p className="text-xs text-slate-500 mb-4">
                                        Place finger on the sensor <strong>twice</strong> (lift between scans).
                                    </p>
                                    <div className="flex justify-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0s" }} />
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline"
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
                                    <p className="text-sm text-red-600 font-bold mb-1">
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
