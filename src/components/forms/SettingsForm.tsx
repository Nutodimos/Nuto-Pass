"use client";

import { updateSchoolConfig } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const SettingsForm = ({ currentSession }: { currentSession: string }) => {
    const [state, formAction] = useFormState(updateSchoolConfig, {
        success: false,
        error: false,
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success("Settings updated successfully!");
            router.refresh();
        } else if (state.error) {
            toast.error(state.messages ? state.messages.join("\n") : "Something went wrong!");
        }
    }, [state, router]);

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Current Session Year</span>
                <input
                    type="text"
                    name="sessionYear"
                    defaultValue={currentSession}
                    placeholder="e.g. 2024/25"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nutoSlate w-full"
                />
            </label>
            <button type="submit" className="bg-nutoSlate text-white p-2 rounded-md hover:bg-nutoSlateDark transition-colors w-full sm:w-auto">
                Update Settings
            </button>
        </form>
    );
};

export default SettingsForm;
