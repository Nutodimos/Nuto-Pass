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
        <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
            <LandingNavbar />

            <main className="flex-1 flex flex-col">
                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between container mx-auto px-4 sm:px-6 py-8 lg:py-16 gap-10 lg:gap-8 relative">
                    {/* Decorative blob */}
                    <div className="absolute top-0 left-10 w-72 h-72 bg-nutoSlate/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 right-10 w-72 h-72 bg-nutoOrange/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

                    <div className="flex-1 text-center lg:text-left space-y-8 z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">


                        <div className="space-y-4">
                            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-gray-900 leading-[0.9] tracking-tight">
                                <span className="block text-gray-800">Secure.</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-nutoSlate to-nutoOrange">Fast.</span>
                                <span className="block text-gray-800">Smart.</span>
                            </h1>
                        </div>

                        <div className="text-lg sm:text-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                            The official biometric attendance system for the
                            <span className="block mt-2 font-bold text-3xl text-gray-800 decoration-nutoOrange decoration-4 underline underline-offset-4">
                                Department of Computer Engineering
                            </span>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                            <a href="/sign-in" className="group relative px-8 py-4 bg-nutoSlate text-white rounded-2xl font-bold overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-nutoSlate/50 btn-nuto">
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-nutoSlate to-nutoOrange opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center gap-2">
                                    Get Started
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </span>
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full w-full max-w-lg lg:max-w-xl h-[400px] lg:h-[700px] z-10 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
                        {/* Using the generated hero image */}
                        <div className="relative w-full h-full animate-float">
                            <img
                                src="/hero.png"
                                alt="NutoPass Dashboard Preview"
                                className="object-contain w-full h-full drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-in-out"
                            />
                        </div>
                    </div>
                </div>

                {/* Role Section */}
                <div className="bg-white py-16">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Choose your Portal</h2>

                        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto">
                            {/* Student Card */}
                            <a href="/sign-in" className="flex-1 group">
                                <div className="p-8 rounded-2xl bg-nutoSlate/5 border border-nutoSlate/20 h-full hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                                    <div className="w-14 h-14 rounded-full bg-nutoSlate/20 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                                        👨‍🎓
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">I am a Student</h3>
                                    <p className="text-gray-600">View your attendance records, check your percentage, and track your academic progress.</p>
                                </div>
                            </a>

                            {/* Teacher Card */}
                            <a href="/sign-in" className="flex-1 group">
                                <div className="p-8 rounded-2xl bg-nutoOrange/5 border border-nutoOrange/20 h-full hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                                    <div className="w-14 h-14 rounded-full bg-nutoOrange/20 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                                        👨‍🏫
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-3">I am a Teacher</h3>
                                    <p className="text-gray-600">Manage detailed attendance, create reports, and monitor student engagement.</p>
                                </div>
                            </a>
                        </div>

                        <div className="mt-12 text-center">
                            <p className="text-sm text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-full border border-gray-100">
                                🔒 Account creation is restricted to Administrators only.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-nutoSlate border-t border-nutoSlateDark py-8">
                <div className="container mx-auto px-6 text-center text-white/80 text-sm">
                    <p>&copy; {new Date().getFullYear()} Nutodimos. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
