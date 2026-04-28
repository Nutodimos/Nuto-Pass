"use client";

import Image from "next/image";
import Link from "next/link";
import { usePwaInstall } from "@/components/PwaInstallProvider";
import { ArrowLeft, Download, Share, PlusSquare } from "lucide-react";

export default function InstallPage() {
  const { isInstallable, promptInstall, isIOS, isStandalone } = usePwaInstall();

  return (
    <div className="min-h-screen bg-CPENavyDark text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-CPENavy rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-CPEGold rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full space-y-8 flex flex-col items-center relative z-10">

        {/* Logo */}
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-CPEGold/20 mb-4 border border-white/10">
          <Image src="/cpeautomation-logo.png" alt="CPE Automation Logo" width={64} height={64} className="rounded-2xl" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">CPE Automation</h1>
          <p className="text-lg text-white/70">
            Get the native app experience. Install CPE Automation directly to your home screen for faster access and offline capabilities.
          </p>
        </div>

        {/* Dynamic Install Instructions */}
        <div className="w-full pt-8 min-h-[200px] flex flex-col justify-center">
          {isStandalone ? (
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl flex flex-col items-center gap-3 backdrop-blur-md">
              <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-xl font-semibold">App Installed!</h2>
              <p className="text-sm text-white/70">You are already using the installed version of CPE Automation.</p>
              <Link href="/" className="mt-4 w-full py-3 bg-white text-CPENavyDark font-semibold rounded-xl hover:bg-gray-100 transition-colors text-center">
                Go to Dashboard
              </Link>
            </div>
          ) : isInstallable ? (
            <button
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-3 py-4 bg-CPEGold text-CPENavyDark font-bold text-lg rounded-2xl shadow-[0_0_40px_-10px_rgba(255,215,0,0.5)] hover:bg-CPEGoldLight transition-all active:scale-95"
            >
              <Download className="w-6 h-6" />
              Install App Now
            </button>
          ) : isIOS ? (
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl text-left space-y-4 backdrop-blur-md">
              <h2 className="text-xl font-semibold text-center mb-6">Install on iPhone / iPad</h2>
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="font-bold">1</span>
                </div>
                <p>Tap the <Share className="inline w-5 h-5 mx-1" /> <strong>Share</strong> button at the bottom of your screen.</p>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="font-bold">2</span>
                </div>
                <p>Scroll down and tap <PlusSquare className="inline w-5 h-5 mx-1" /> <strong>Add to Home Screen</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 border border-white/20 p-6 rounded-2xl flex flex-col items-center gap-3 backdrop-blur-md">
              <h2 className="text-xl font-semibold">Desktop / Unsupported Browser</h2>
              <p className="text-sm text-white/70 text-center">
                To install this app, please open this page on a supported mobile device (Chrome on Android or Safari on iOS), or use the install button in your desktop browser's address bar.
              </p>
            </div>
          )}
        </div>

        <Link href="/" className="flex items-center justify-center gap-2 text-white/60 hover:text-white mt-12 transition-colors w-full p-4">
          <ArrowLeft className="w-4 h-4" />
          Continue to website
        </Link>
      </div>
    </div>
  );
}
