"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { markAnnouncementAsRead, markAllAnnouncementsAsRead } from "@/lib/actions";
import { toast } from "react-toastify";

export default function MarkReadButton({
  announcementId,
  isAll = false,
}: {
  announcementId?: number;
  isAll?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMark = () => {
    startTransition(async () => {
      let result;
      if (isAll) {
        result = await markAllAnnouncementsAsRead();
      } else {
        if (!announcementId) return;
        result = await markAnnouncementAsRead(announcementId);
      }

      if (result.success) {
        // Dispatch global event for Navbar to pick up
        window.dispatchEvent(new Event("refresh-notifications"));
        
        // Refresh this page to update the list UI
        router.refresh();
        
        // Show lightweight toast on Mark All
        if (isAll) {
          toast.success("All announcements marked as read!");
        } else {
          toast.success("Marked as read", { autoClose: 2000 });
        }
      } else {
        toast.error("Failed to mark as read");
      }
    });
  };

  if (isAll) {
    return (
      <button
        onClick={handleMark}
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-CPENavy text-white font-medium text-sm hover:bg-CPENavyDark transition-colors flex items-center gap-2 active:scale-95 disabled:opacity-70"
      >
        <Check className="w-4 h-4" />
        {isPending ? "Marking..." : "Mark All as Read"}
      </button>
    );
  }

  return (
    <button
      onClick={handleMark}
      disabled={isPending}
      className="opacity-0 group-hover:opacity-100 transition-all duration-300 px-3 py-1.5 rounded-lg bg-CPENavy/10 text-CPENavy hover:bg-CPENavy hover:text-white text-sm font-medium active:scale-95 disabled:opacity-50"
    >
      {isPending ? "Marking..." : "Mark as Read"}
    </button>
  );
}
