"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteOrganization } from "@/lib/super-admin-actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface DeleteOrgButtonProps {
  orgId: string;
  orgName: string;
  variant?: "icon" | "button";
}

export function DeleteOrgButton({ orgId, orgName, variant = "icon" }: DeleteOrgButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you sure you want to permanently delete "${orgName}"?\n\nThis will permanently delete all students, lecturers, classes, grades, attendances, and associated Clerk user accounts.\n\nThis action CANNOT be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteOrganization(orgId);
      if (result && result.error) {
        toast.error(result.messages?.join("\n") || "Failed to delete organization");
      } else {
        toast.success(`Organisation "${orgName}" deleted successfully!`);
        if (variant === "button") {
          router.push("/super-admin/organisations");
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || "An unexpected error occurred."));
    } finally {
      setIsDeleting(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20"
      >
        {isDeleting ? "Deleting..." : "Delete Organisation"}
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
      title={`Delete ${orgName}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
