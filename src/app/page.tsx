import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingNavbar from "@/components/LandingNavbar";
import { GraduationCap, Presentation } from "lucide-react";

export default function Homepage() {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (userId && role) {
        redirect(`/${role}`);
    }

    return (
        <div data-theme="light" className="flex flex-col min-h-screen bg-[#F7F8FA] overflow-x-hidden selection:bg-CPEGold/20 selection:text-CPEGoldDark">
            <LandingNavbar />

            <main className="flex-1 hidden lg:flex flex-col relative">
                {/* Global Background Elements for CPE Theme feel */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-CPENavy/5 via-white to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-CPEGold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -left-20 w-80 h-80 bg-CPENavy/10 rounded-full blur-3xl pointer-events-none" />

                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between container mx-auto px-6 py-6 sm:py-12 lg:py-24 gap-8 lg:gap-16 relative z-10">
                    <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-slate-200/60 backdrop-blur-md shadow-sm mb-4">
                            <span className="w-2 h-2 rounded-full bg-CPEGold animate-pulse" />
                            <span className="text-sm font-medium text-slate-600">Smart Campus Ready</span>
                        </div>

                        <div className="space-y-2 sm:space-y-4">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-800 leading-[1.05] tracking-tight">
                                <span className="block mb-1 sm:mb-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Secure.</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-CPENavy to-CPEGoldDark drop-shadow-sm text-5xl sm:text-6xl lg:text-7xl xl:text-8xl">Fast.</span>
                                <span className="block mt-1 sm:mt-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">Smart.</span>
                            </h1>
                        </div>

                        <div className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            The official biometric attendance system for the
                            <span className="block mt-2 font-bold text-2xl text-slate-800 decoration-CPEGold/30 decoration-4 underline underline-offset-4">
                                Department of Computer Engineering
                            </span>
                        </div>

                        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a href="/sign-in" className="group relative px-8 py-4 bg-gradient-to-r from-CPENavy to-CPENavyDark text-white rounded-2xl font-bold overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-CPENavy/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
                                <span>Access Portal</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full max-w-lg lg:max-w-2xl z-10 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
                        <div className="relative w-full aspect-square md:aspect-auto md:h-[600px] animate-float">
                            {/* Decorative background for the image to give it a "dashboard" widget feel */}
                            <div className="absolute inset-4 bg-gradient-to-br from-white/40 to-white/10 rounded-[3rem] blur-2xl -z-10" />
                            <img
                                src="/hero.png"
                                alt="CPE Automation Dashboard Preview"
                                className="object-contain w-full h-full drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-in-out"
                            />
                        </div>
                    </div>
                </div>

                {/* Role Section */}
                <div className="relative py-12 sm:py-24 z-10">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-y border-slate-100/50" />
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Choose your Portal</h2>
                            <p className="text-slate-500 max-w-lg mx-auto">Select your role to access your personalized dashboard and manage your attendance records.</p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
                            {/* Student Card - Modeled after dashboard UserCard */}
                            <a href="/sign-in" className="flex-1 group relative rounded-3xl p-8 overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100/50">
                                <div className="absolute inset-0 bg-gradient-to-br from-CPEGold/5 to-CPEGold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform origin-top-right text-slate-900 pointer-events-none">
                                    <GraduationCap size={180} strokeWidth={1} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-CPEGold/20 to-CPEGoldLight/30 text-CPEGoldDark flex items-center justify-center mb-8 shadow-inner border border-CPEGold/10 group-hover:scale-110 transition-transform duration-300">
                                        <GraduationCap className="w-8 h-8" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-CPEGold transition-colors">Student Portal</h3>
                                    <p className="text-slate-600 leading-relaxed mb-6 flex-1">View your attendance records, verify your biometric check-ins, and track your academic progress across all enrolled courses.</p>
                                    <div className="flex items-center text-sm font-bold text-CPEGold gap-1 group-hover:gap-2 transition-all">
                                        Sign In <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </a>

                            {/* Teacher Card - Modeled after dashboard UserCard */}
                            <a href="/sign-in" className="flex-1 group relative rounded-3xl p-8 overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100/50">
                                <div className="absolute inset-0 bg-gradient-to-br from-CPENavy/5 to-CPENavy/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform origin-top-right text-slate-900 pointer-events-none">
                                    <Presentation size={180} strokeWidth={1} />
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-CPESlate/20 to-CPENavy/30 text-CPENavyDark flex items-center justify-center mb-8 shadow-inner border border-CPENavy/10 group-hover:scale-110 transition-transform duration-300">
                                        <Presentation className="w-8 h-8" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-CPENavy transition-colors">Lecturer Portal</h3>
                                    <p className="text-slate-600 leading-relaxed mb-6 flex-1">Manage class attendance sessions, create analytical reports, and monitor student engagement seamlessly.</p>
                                    <div className="flex items-center text-sm font-bold text-CPENavy gap-1 group-hover:gap-2 transition-all">
                                        Sign In <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* <div className="mt-16 text-center">
                            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200/60">
                                <span className="text-xl">🔒</span>
                                <p className="text-sm font-medium text-slate-600">
                                    Account creation is restricted to System Administrators only.
                                </p>
                            </div>
                        </div> */}
                    </div>
                </div>
            </main>

            {/* --- CUSTOM NATIVE MOBILE SPLASH SCREEN --- */}
            <main className="flex lg:hidden flex-col min-h-[100dvh] bg-gradient-to-br from-CPENavy to-CPENavyDark overflow-hidden relative">
                {/* Background Decor Elements */}
                <div className="absolute top-[-10%] right-[-20%] w-96 h-96 bg-CPEGold/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                <div className="absolute bottom-[20%] left-[-20%] w-72 h-72 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                
                {/* Top Branding Section */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 animate-in fade-in slide-in-from-top-10 duration-1000 relative">
                    <div className="relative w-32 h-32 mb-8 animate-float">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl -z-10" />
                        <img src="/cpeautomation-logo.png" alt="CPE Automation Logo" className="w-full h-full object-contain filter drop-shadow-2xl brightness-0 invert" />
                    </div>
                    
                    <h1 className="text-4xl font-black text-white text-center tracking-tight mb-3">
                        CPE Automation
                    </h1>
                    <p className="text-white/80 text-center font-medium px-4 text-sm sm:text-base leading-relaxed">
                        Secure Biometric Identity & Attendance Core.
                    </p>
                </div>
                
                {/* Bottom Action Dock */}
                <div className="w-full bg-white/10 backdrop-blur-3xl rounded-t-[2.5rem] p-8 pb-12 z-20 border-t border-white/20 shadow-2xl animate-in slide-in-from-bottom-full duration-1000 delay-300">
                    <div className="max-w-sm mx-auto space-y-4">
                        <div className="text-center mb-6">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-semibold tracking-wide border border-white/10 shadow-sm">
                                Choose Your Access Point
                            </span>
                        </div>
                        
                        <a href="/sign-in" className="flex items-center gap-4 w-full p-4 rounded-3xl bg-CPEGold hover:bg-CPEGoldDark text-CPENavyDark transition-all duration-300 active:scale-95 group shadow-[0_8px_30px_rgba(255,193,7,0.3)]">
                            <div className="w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-lg">Student Login</h3>
                                <p className="text-CPENavyDark/70 text-xs font-semibold">Track your attendance records</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </a>
                        
                        <a href="/sign-in" className="flex items-center gap-4 w-full p-4 rounded-3xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 active:scale-95 group border border-white/10 hover:border-white/30">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <Presentation className="w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-lg">Lecturer Login</h3>
                                <p className="text-white/60 text-xs font-semibold">Manage your class sessions</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </a>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="hidden lg:block bg-white border-t border-slate-200 py-10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                        <img src="/cpeautomation-logo.png" alt="logo" className="w-6 h-6 object-contain" />
                        <span className="font-bold text-slate-700 text-xs sm:text-sm">CPE Automation</span>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium text-center">&copy; {new Date().getFullYear()} Nutodimos. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
