"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Define the type for the BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallContextType {
  isInstallable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  promptInstall: () => Promise<void>;
  isIOS: boolean;
  isStandalone: boolean;
}

const PwaInstallContext = createContext<PwaInstallContextType>({
  isInstallable: false,
  installPrompt: null,
  promptInstall: async () => {},
  isIOS: false,
  isStandalone: false,
});

export const usePwaInstall = () => useContext(PwaInstallContext);

export default function PwaInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's already installed (standalone mode)
    const checkStandalone = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://")
      );
    };

    setIsStandalone(checkStandalone());

    // Check for iOS (Apple doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later.
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful installation
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return;
    }
    
    // Show the install prompt
    try {
      await installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      
      // We've used the prompt, and can't use it again, throw it away
      if (outcome === "accepted") {
        setInstallPrompt(null);
        setIsInstallable(false);
      }
    } catch (err) {
      console.error("Error prompting for install:", err);
    }
  };

  return (
    <PwaInstallContext.Provider
      value={{ isInstallable, installPrompt, promptInstall, isIOS, isStandalone }}
    >
      {children}
    </PwaInstallContext.Provider>
  );
}
