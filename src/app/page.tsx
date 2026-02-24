import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingNavbar from "@/components/LandingNavbar";

export default function Homepage() {
    const { userId, sessionClaims } = auth();
    console.log(`Homepage: Role=${(sessionClaims?.metadata as any)?.role}, UserId=${userId}`);

    // role is typed as string | undefined in metadata, but we cast to be safe
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (userId && role) {
        redirect(`/${role}`);
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F7F8FA] overflow-x-hidden selection:bg-nutoOrange/20 selection:text-nutoOrangeDark">
            <LandingNavbar />

            <main className="flex-1 flex flex-col relative">
                {/* Global Background Elements for Nuto Theme feel */}
                <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-nutoSlate/5 via-white to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-nutoOrange/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -left-20 w-80 h-80 bg-nutoSlate/10 rounded-full blur-3xl pointer-events-none" />

                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between container mx-auto px-6 py-12 lg:py-24 gap-16 relative z-10">
                    <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-slate-200/60 backdrop-blur-md shadow-sm mb-4">
                            <span className="w-2 h-2 rounded-full bg-nutoOrange animate-pulse" />
                            <span className="text-sm font-medium text-slate-600">Smart Campus Ready</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-slate-800 leading-[1.05] tracking-tight">
                                <span className="block mb-2">Secure.</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-nutoSlate to-nutoOrangeDark drop-shadow-sm">Fast.</span>
                                <span className="block mt-2">Smart.</span>
                            </h1>
                        </div>

                        <div className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            The official biometric attendance system for the
                            <span className="block mt-2 font-bold text-2xl text-slate-800 decoration-nutoOrange/30 decoration-4 underline underline-offset-4">
                                Department of Computer Engineering
                            </span>
                        </div>

                        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <a href="/sign-in" className="group relative px-8 py-4 bg-gradient-to-r from-nutoSlate to-nutoSlateDark text-white rounded-2xl font-bold overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-nutoSlate/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
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
                                alt="NutoPass Dashboard Preview"
                                className="object-contain w-full h-full drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-in-out"
                            />
                        </div>
                    </div>
                </div>

                {/* Role Section */}
                <div className="relative py-24 z-10">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border-y border-slate-100/50" />
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Choose your Portal</h2>
                            <p className="text-slate-500 max-w-lg mx-auto">Select your role to access your personalized dashboard and manage your attendance records.</p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
                            {/* Student Card - Modeled after dashboard UserCard */}
                            <a href="/sign-in" className="flex-1 group relative rounded-3xl p-8 overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100/50">
                                <div className="absolute inset-0 bg-gradient-to-br from-nutoOrange/5 to-nutoOrange/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform origin-top-right">
                                    <span className="text-9xl">👨‍🎓</span>
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nutoOrange/20 to-nutoOrangeLight/30 text-nutoOrangeDark flex items-center justify-center mb-8 text-3xl shadow-inner border border-nutoOrange/10 group-hover:scale-110 transition-transform duration-300">
                                        👨‍🎓
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-nutoOrange transition-colors">Student Portal</h3>
                                    <p className="text-slate-600 leading-relaxed mb-6 flex-1">View your attendance records, verify your biometric check-ins, and track your academic progress across all enrolled courses.</p>
                                    <div className="flex items-center text-sm font-bold text-nutoOrange gap-1 group-hover:gap-2 transition-all">
                                        Sign In <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </a>

                            {/* Teacher Card - Modeled after dashboard UserCard */}
                            <a href="/sign-in" className="flex-1 group relative rounded-3xl p-8 overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100/50">
                                <div className="absolute inset-0 bg-gradient-to-br from-nutoSlate/5 to-nutoSlate/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform origin-top-right">
                                    <span className="text-9xl">👨‍🏫</span>
                                </div>
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nutoSlateLight/20 to-nutoSlate/30 text-nutoSlateDark flex items-center justify-center mb-8 text-3xl shadow-inner border border-nutoSlate/10 group-hover:scale-110 transition-transform duration-300">
                                        👨‍🏫
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-nutoSlate transition-colors">Lecturer Portal</h3>
                                    <p className="text-slate-600 leading-relaxed mb-6 flex-1">Manage class attendance sessions, create analytical reports, and monitor student engagement seamlessly.</p>
                                    <div className="flex items-center text-sm font-bold text-nutoSlate gap-1 group-hover:gap-2 transition-all">
                                        Sign In <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </a>
                        </div>

                        <div className="mt-16 text-center">
                            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200/60">
                                <span className="text-xl">🔒</span>
                                <p className="text-sm font-medium text-slate-600">
                                    Account creation is restricted to System Administrators only.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                        <img src="/nutopass-logo.png" alt="logo" className="w-6 h-6 object-contain" />
                        <span className="font-bold text-slate-700">NutoPass</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">&copy; {new Date().getFullYear()} Nutodimos. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
