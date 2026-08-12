"use client";

import { CheckCircle2, Fingerprint, MapPin, Clock } from "lucide-react";
import Image from "next/image";

export default function VerificationDisplay() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-50/50">
            {/* The Scanner Module Simulator */}
            <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-t-3xl -z-10" />
                
                <div className="text-center mt-2 mb-8">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg border-4 border-emerald-500 relative">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-20" />
                    </div>
                    <h2 className="text-2xl font-black text-white mt-4 tracking-tight">Identity Verified</h2>
                    <p className="text-emerald-100 text-sm font-medium">Access Granted</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm relative">
                            <Image src="/noAvatar.png" alt="Student" fill className="object-cover" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">John Doe</h3>
                            <p className="text-sm text-slate-500 font-medium">CPE/2019/001 • 400L</p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-700">08:15 AM</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-700">Main Hall</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Biometric Match: 98%</span>
                </div>
            </div>
        </div>
    );
}
