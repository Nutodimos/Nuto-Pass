import SettingsForm from "@/components/forms/SettingsForm";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Settings, Shield } from "lucide-react";

const SettingsPage = async () => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
        return redirect("/");
    }

    // Fetch current settings
    const [sessionConfig, semesterConfig] = await Promise.all([
        prisma.schoolConfig.findUnique({ where: { key: "sessionYear" } }),
        prisma.schoolConfig.findUnique({ where: { key: "currentSemester" } }),
    ]);

    const currentSession = sessionConfig?.value || "2024/25";
    const currentSemester = semesterConfig?.value || "1";

    // Get semester display text
    const semesterText = currentSemester === "1" ? "Harmattan Semester"
        : "Rain Semester";

    return (
        <div className="flex-1 m-4 mt-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-nutoSlate to-nutoSlateDark rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">School Settings</h1>
                        <p className="text-white/80 text-sm">Configure academic session and semester</p>
                    </div>
                </div>
            </div>

            {/* Current Status Banner */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-nutoSlate" />
                    <div>
                        <span className="text-sm text-gray-600">Current Status: </span>
                        <span className="font-semibold text-nutoSlate">{currentSession}</span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span className="font-semibold text-amber-600">{semesterText}</span>
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-lg">
                <SettingsForm
                    currentSession={currentSession}
                    currentSemester={currentSemester}
                />
            </div>
        </div>
    );
};

export default SettingsPage;
