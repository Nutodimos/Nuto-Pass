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
        const toastId = toast.loading("Preparing upload...");

        try {
            let uploadedFilePath: string | null = null;

            // ─── 1. Attempt Direct Azure Blob Storage Upload (SAS) ───
            try {
                const sasResponse = await fetch("/api/upload/azure-sas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type || "application/octet-stream",
                        category,
                    }),
                });

                const sasData = await sasResponse.json();

                if (sasResponse.ok && sasData.success && sasData.uploadUrl) {
                    toast.update(toastId, {
                        render: "Uploading to Azure Storage...",
                        type: "info",
                        isLoading: true,
                    });

                    // Direct PUT to Azure Blob Storage BlockBlob endpoint
                    const azureUploadResponse = await fetch(sasData.uploadUrl, {
                        method: "PUT",
                        headers: {
                            "x-ms-blob-type": "BlockBlob",
                            "Content-Type": file.type || "application/octet-stream",
                        },
                        body: file,
                    });

                    if (!azureUploadResponse.ok) {
                        throw new Error(`Azure upload failed with status ${azureUploadResponse.status}`);
                    }

                    uploadedFilePath = sasData.filePath;
                }
            } catch (azureErr) {
                console.warn("Azure SAS direct upload unavailable, falling back to local upload:", azureErr);
            }

            // ─── 2. Fallback to Local Server Upload if Azure not used ───
            if (!uploadedFilePath) {
                toast.update(toastId, {
                    render: "Uploading file...",
                    type: "info",
                    isLoading: true,
                });

                const formData = new FormData();
                formData.append("file", file);
                formData.append("category", category);

                const localResponse = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                const localResult = await localResponse.json();

                if (!localResponse.ok) {
                    throw new Error(localResult.error || "Upload failed");
                }

                uploadedFilePath = localResult.filePath;
            }

            if (!uploadedFilePath) {
                throw new Error("Upload failed to return a valid file path");
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

            // Call success callback
            onSuccess(
                { info: { secure_url: uploadedFilePath } },
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
