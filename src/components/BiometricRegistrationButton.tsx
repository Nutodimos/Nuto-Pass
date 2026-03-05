"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import { useRouter } from "next/navigation";

const BiometricRegistrationButton = ({ studentId }: { studentId: string }) => {
    const [open, setOpen] = useState(false);
    const [biometricId, setBiometricId] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/student/biometric", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, biometricId }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setOpen(false);
                setBiometricId("");
                router.refresh();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-CPEGold"
                title="Register Biometric ID"
            >
                {/* Using a generic icon or the sort icon as placeholder if fingerprint not available */}
                <span className="text-xs font-bold text-white">ID</span>
            </button>

            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-md p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={() => setOpen(false)}
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Register Biometric ID</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Biometric ID / Hash
                                </label>
                                <input
                                    type="text"
                                    value={biometricId}
                                    onChange={(e) => setBiometricId(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-CPENavy focus:border-transparent"
                                    placeholder="Scan or enter ID..."
                                    autoFocus
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Focus this field and use the scanner if applicable.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm text-white bg-CPENavy rounded-md hover:opacity-90 disabled:opacity-50 btn-cpe"
                                    disabled={loading}
                                >
                                    {loading ? "Registering..." : "Register"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default BiometricRegistrationButton;
