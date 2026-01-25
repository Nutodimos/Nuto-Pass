"use client";

import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useState, useRef, ReactNode } from "react";
import { toast } from "react-toastify";

interface FirebaseUploadWidgetProps {
    uploadPreset?: string; // Kept for compatibility but unused
    onSuccess: (result: { info: { secure_url: string } }, { widget }: { widget: { close: () => void } }) => void;
    children: (props: { open: () => void }) => ReactNode;
}

const FirebaseUploadWidget = ({ onSuccess, children }: FirebaseUploadWidgetProps) => {
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
            // Create a unique filename
            const fileName = `${Date.now()}-${file.name}`;
            const storageRef = ref(storage, `uploads/${fileName}`);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    // Progress... 
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // We could show progress bar here if needed
                },
                (error) => {
                    console.error(error);
                    toast.update(toastId, { render: "Upload failed! Check console.", type: "error", isLoading: false, autoClose: 3000 });
                    setUploading(false);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        toast.update(toastId, { render: "Upload successful!", type: "success", isLoading: false, autoClose: 3000 });
                        setUploading(false);

                        // Allow selecting same file again if needed
                        if (fileInputRef.current) fileInputRef.current.value = "";

                        // Call success callback with Cloudinary-like structure
                        onSuccess(
                            { info: { secure_url: downloadURL } },
                            { widget: { close: () => { } } }
                        );
                    });
                }
            );

        } catch (err) {
            console.error(err);
            toast.update(toastId, { render: "Upload failed! Check config.", type: "error", isLoading: false, autoClose: 3000 });
            setUploading(false);
        }
    };

    const open = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
            />
            {children({ open })}
        </>
    );
};

export default FirebaseUploadWidget;
