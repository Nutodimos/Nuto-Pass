"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

const LoginPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [matricNo, setMatricNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!matricNo || !password) {
      toast.error("Please enter both Matric No and Password");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: matricNo,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
        toast.success("Welcome back!");
      } else {
        console.log(result);
        toast.info("Additional steps required for login.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Clerk errors array
      const errorMessage = err.errors?.[0]?.message || "Invalid Matric No or Password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl flex overflow-hidden max-w-4xl w-full border border-gray-100">

        {/* Left Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-nutoSlate to-nutoOrange items-center justify-center p-12 relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl animate-blob"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-xl animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10 text-center text-gray-800">
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="relative w-16 h-16">
                <Image src="/nutopass-logo.png" alt="Logo" fill className="object-contain mix-blend-multiply" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold mb-2 text-gray-900">NutoPass</h2>
            <p className="text-gray-700 font-medium opacity-90">Secure Biometric Attendance</p>

            <div className="mt-8 text-sm bg-white/30 backdrop-blur-md p-4 rounded-xl border border-white/40">
              <p className="italic">"Department of Computer Engineering"</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 bg-white relative">
          <Link href="/" className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>

          <div className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
            <p className="text-gray-500">Please sign in to access your portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Matric No / Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nutoSlate focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="Enter your Matric No"
                />
                <span className="absolute right-3 top-3.5 text-xl">🎓</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nutoSlate focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
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
              className="w-full py-3.5 bg-nutoSlate text-white rounded-xl font-bold shadow-lg hover:bg-nutoSlateDark hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 btn-nuto"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              Having trouble? Contact the <span className="text-nutoSlate font-semibold cursor-help" title="Contact Admin">System Administrator</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
