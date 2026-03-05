"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A global navigation progress bar that shows at the top of the page
 * during route transitions. Uses Next.js App Router hooks to detect
 * navigation start/end.
 */
const NavigationProgress = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up timers
    const cleanup = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    // Complete the progress bar
    const completeProgress = useCallback(() => {
        cleanup();
        setProgress(100);
        timeoutRef.current = setTimeout(() => {
            setIsNavigating(false);
            setProgress(0);
        }, 300);
    }, [cleanup]);

    // When pathname or search params change, navigation is complete
    useEffect(() => {
        completeProgress();
    }, [pathname, searchParams, completeProgress]);

    // Listen for click events on links and buttons
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");
            const button = target.closest("button");

            // Check if it's a navigation link (not external, not download, not new tab)
            if (anchor) {
                const href = anchor.getAttribute("href");
                if (
                    href &&
                    href.startsWith("/") &&
                    !anchor.hasAttribute("download") &&
                    anchor.target !== "_blank" &&
                    !e.ctrlKey &&
                    !e.metaKey
                ) {
                    // Don't trigger for same-page anchors
                    if (href === pathname) return;

                    // Start the progress bar
                    cleanup();
                    setIsNavigating(true);
                    setProgress(15);

                    // Simulate progress
                    intervalRef.current = setInterval(() => {
                        setProgress((prev) => {
                            if (prev >= 90) return prev;
                            const increment = Math.random() * 15;
                            return Math.min(prev + increment, 90);
                        });
                    }, 300);
                }
            }

            // Add active feedback to buttons
            if (button) {
                button.classList.add("cpe-btn-active");
                setTimeout(() => {
                    button.classList.remove("cpe-btn-active");
                }, 200);
            }
        };

        document.addEventListener("click", handleClick, true);

        return () => {
            document.removeEventListener("click", handleClick, true);
            cleanup();
        };
    }, [pathname, cleanup]);

    if (!isNavigating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            {/* Progress bar */}
            <div
                className="h-[3px] bg-gradient-to-r from-CPEGold via-CPEGoldDark to-CPENavy transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 10px rgba(255, 127, 80, 0.7), 0 0 5px rgba(255, 127, 80, 0.5)",
                }}
            />
            {/* Glow pulse at the end of the bar */}
            <div
                className="absolute top-0 right-0 h-[3px] w-24 opacity-80"
                style={{
                    transform: `translateX(${progress < 100 ? '0' : '100%'})`,
                    background: "linear-gradient(to right, transparent, rgba(255, 127, 80, 0.8))",
                    animation: "pulse-glow 1.5s ease-in-out infinite",
                }}
            />
            <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default NavigationProgress;
