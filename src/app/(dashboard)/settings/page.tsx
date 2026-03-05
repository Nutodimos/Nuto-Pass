import SettingsForm from "@/components/forms/SettingsForm";
import ProfileSettings from "@/components/forms/ProfileSettings";
import ThemeSettings from "@/components/forms/ThemeSettings";
import SecuritySettings from "@/components/forms/SecuritySettings";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Settings, User, Palette, Shield, Lock } from "lucide-react";

// Client wrapper for tabs
import SettingsTabs from "./SettingsTabs";

const SettingsPage = async () => {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || !role) {
        return redirect("/");
    }

    // Fetch profile data for teacher or student
    let profile = null;
    if (role === "teacher") {
        const teacher = await prisma.teacher.findUnique({
            where: { id: userId },
        });
        if (teacher) {
            profile = {
                name: teacher.name,
                surname: teacher.surname,
                username: teacher.username,
                email: teacher.email,
                phone: teacher.phone,
                address: teacher.address,
                bloodType: teacher.bloodType,
                sex: teacher.sex,
                birthday: teacher.birthday?.toISOString() || null,
                img: teacher.img,
            };
        }
    } else if (role === "student") {
        const student = await prisma.student.findUnique({
            where: { id: userId },
        });
        if (student) {
            profile = {
                name: student.name,
                surname: student.surname,
                username: student.username,
                email: student.email,
                phone: student.phone,
                address: student.address,
                bloodType: student.bloodType,
                sex: student.sex,
                birthday: student.birthday?.toISOString() || null,
                img: student.img,
            };
        }
    }

    // Fetch school config for admin
    let currentSession = "2024/25";
    let currentSemester = "1";
    if (role === "admin") {
        const [sessionConfig, semesterConfig] = await Promise.all([
            prisma.schoolConfig.findUnique({ where: { key: "sessionYear" } }),
            prisma.schoolConfig.findUnique({ where: { key: "currentSemester" } }),
        ]);
        currentSession = sessionConfig?.value || "2024/25";
        currentSemester = semesterConfig?.value || "1";
    }

    // Get semester display text
    const semesterText = currentSemester === "1" ? "Harmattan Semester" : "Rain Semester";

    // Build tabs based on role
    const tabs = [];

    if (profile) {
        tabs.push({
            id: "profile",
            label: "Profile",
            icon: "user",
            content: <ProfileSettings profile={profile} role={role} />,
        });
    }

    tabs.push({
        id: "appearance",
        label: "Appearance",
        icon: "palette",
        content: <ThemeSettings />,
    });

    tabs.push({
        id: "security",
        label: "Security",
        icon: "lock",
        content: <SecuritySettings />,
    });

    if (role === "admin") {
        tabs.push({
            id: "school",
            label: "School Config",
            icon: "shield",
            content: (
                <div className="space-y-4">
                    {/* Current Status Banner */}
                    <div
                        className="rounded-xl p-4 border"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-primary)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-CPENavy" />
                            <div>
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Status: </span>
                                <span className="font-semibold text-CPENavy">{currentSession}</span>
                                <span className="mx-2" style={{ color: 'var(--text-tertiary)' }}>•</span>
                                <span className="font-semibold text-amber-600">{semesterText}</span>
                            </div>
                        </div>
                    </div>
                    <SettingsForm
                        currentSession={currentSession}
                        currentSemester={currentSemester}
                    />
                </div>
            ),
        });
    }

    return (
        <div className="flex-1 m-4 mt-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-CPENavy to-CPENavyDark rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                        <p className="text-white/80 text-sm">
                            Manage your profile, appearance, and preferences
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabbed Content */}
            <SettingsTabs tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))} >
                {tabs.map(t => (
                    <div key={t.id} data-tab-id={t.id}>
                        {t.content}
                    </div>
                ))}
            </SettingsTabs>
        </div>
    );
};

export default SettingsPage;
