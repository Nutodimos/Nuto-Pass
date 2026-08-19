"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const LoginPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const [matricNo, setMatricNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if user is already signed in (avoiding "Session already exists" error)
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isAuthLoaded, isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!matricNo || !password) {
      toast.error("Please enter both Matric No and Password");
      return;
    }

    setLoading(true);

    const rawIdentifier = matricNo.trim();
    const normalizedIdentifier = rawIdentifier.includes("/")
      ? rawIdentifier.toLowerCase().replace(/[^a-z0-9_.]/g, "_")
      : rawIdentifier;

    try {
      let result;
      try {
        result = await signIn.create({
          identifier: normalizedIdentifier,
          password,
        });
      } catch (firstErr: any) {
        if (normalizedIdentifier !== rawIdentifier) {
          // Fallback to raw identifier if normalized failed
          result = await signIn.create({
            identifier: rawIdentifier,
            password,
          });
        } else {
          throw firstErr;
        }
      }

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
        toast.success("Welcome back!");
      } else {
        console.log("Clerk incomplete sign-in result:", result);
        toast.info(`Additional steps required: ${result.status}`);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.errors?.[0]?.message === "Session already exists") {
        toast.info("You are already signed in. Redirecting...");
        router.replace("/");
        return;
      }
      const errorMessage = err.errors?.[0]?.message || "Invalid Matric No or Password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-theme="light" className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4 relative overflow-hidden selection:bg-CPEGold/20 selection:text-CPEGoldDark">

      {/* Background Decorative Elements */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-CPENavy/5 via-[#F7F8FA] to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-CPENavy/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-CPEGold/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[10000ms]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white p-8 sm:p-12 relative overflow-hidden">

          {/* Subtle inner gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/40 -z-10" />

          {/* Logo Heading area */}
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="group mb-6 relative hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-CPENavy/20 rounded-2xl blur-xl group-hover:bg-CPENavy/30 transition-colors" />
              <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center relative z-10 p-4">
                <Image src="/cpeautomation-logo.png" alt="Logo" fill className="object-contain p-2 mix-blend-multiply" />
              </div>
            </Link>

            <h2 className="text-3xl font-black text-slate-800 tracking-tight text-center mb-2">
              Welcome back
            </h2>
            <p className="text-slate-500 text-center font-mediumtext-sm">
              Please enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Matric No / Username</label>
              <div className="relative group">
                <input
                  type="text"
                  name="identifier"
                  autoComplete="username"
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-CPENavy/10 focus:border-CPENavy/50 focus:bg-white transition-all duration-300"
                  placeholder="e.g. CPE/19/..."
                />
                <span className="absolute right-4 top-4 text-emerald-600/50 group-focus-within:text-CPENavy transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-CPENavy/10 focus:border-CPENavy/50 focus:bg-white transition-all duration-300 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-gradient-to-r from-CPENavy to-CPENavyDark text-white rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgba(67,98,117,0.3)] hover:shadow-[0_8px_30px_rgba(67,98,117,0.5)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span className="relative z-10">Authenticating...</span>
                </>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Sign In to Dashboard
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              )}
            </button>
          </form>

        </div>

        {/* Footer text */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
            Having trouble? Contact the{' '}
            <span className="text-CPENavy font-bold cursor-help hover:underline decoration-CPEGold decoration-2" title="Contact Admin">
              System Administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
