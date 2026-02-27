"use client";

import { useState, useRef, ReactNode } from "react";
import { toast } from "react-toastify";

interface LocalUploadWidgetProps {
    category: "materials" | "assignments" | "avatars";
    onSuccess: (result: { info: { secure_url: string } }, { widget }: { widget: { close: () => void } }) => void;
    children: (props: { open: () => void }) => ReactNode;
    accept?: string;
}

const LocalUploadWidget = ({ category, onSuccess, children, accept }: LocalUploadWidgetProps) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Prevent multiple uploads if one is in progress
        if (uploading) return;

        setUploading(true);
        const toastId = toast.loading("Uploading...");

        try {
            // Create form data
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", category);

            // Upload to API
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Upload failed");
            }

            toast.update(toastId, {
                render: "Upload successful!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });
            setUploading(false);

            // Reset input for future uploads
            if (fileInputRef.current) fileInputRef.current.value = "";

            // Call success callback with Cloudinary-like structure for compatibility
            onSuccess(
                { info: { secure_url: result.filePath } },
                { widget: { close: () => { } } }
            );

        } catch (err: any) {
            console.error("Upload error:", err);
            toast.update(toastId, {
                render: err.message || "Upload failed!",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            setUploading(false);
        }
    };

    const open = () => {
        if (!uploading) {
            fileInputRef.current?.click();
        }
    };

    // Default accept types based on category
    const defaultAccept = category === "materials"
        ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
        : ".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png";

    return (
        <>
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept || defaultAccept}
                disabled={uploading}
            />
            {children({ open })}
        </>
    );
};

export default LocalUploadWidget;
