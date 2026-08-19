"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, X, ArrowRight } from "lucide-react";

interface IncompleteProfileBannerProps {
  userId: string;
  missingFields: string[];
}

export default function IncompleteProfileBanner({
  userId,
  missingFields,
}: IncompleteProfileBannerProps) {
  const [dismissed, setDismissed] = useState(true); // default to true on initial render to prevent SSR hydration mismatch

  const storageKey = `nutopass_profile_banner_dismissed_${userId}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem(storageKey) === "true";
      setDismissed(isDismissed);
    }
  }, [storageKey]);

  if (dismissed || missingFields.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, "true");
    }
  };

  const formattedMissing = missingFields
    .map((field) => {
      switch (field) {
        case "birthday":
          return "date of birth";
        case "phone":
          return "phone number";
        case "email":
          return "email address";
        case "address":
          return "residential address";
        case "sex":
          return "gender";
        default:
          return field;
      }
    })
    .join(", ");

  return (
    <div className="mx-4 md:mx-6 mt-3 mb-1 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50/50 border border-amber-200/90 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 pr-8 sm:pr-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0 text-amber-700">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-amber-950">
              Profile Incomplete
            </p>
            <p className="text-xs text-amber-800/90 leading-tight truncate sm:whitespace-normal">
              Please complete your <span className="font-medium">{formattedMissing}</span> in settings to keep your academic records up to date.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all duration-200"
          >
            <span>Update Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleDismiss}
            title="Dismiss notification"
            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-amber-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
