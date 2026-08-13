import prisma from "@/lib/prisma";
import SettingsForm from "@/components/forms/SettingsForm";
import ProfileSettings from "@/components/forms/ProfileSettings";
import ThemeSettings from "@/components/forms/ThemeSettings";
import SecuritySettings from "@/components/forms/SecuritySettings";
import AttendanceArchiveSettings from "@/components/forms/AttendanceArchiveSettings";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Settings, Shield } from "lucide-react";

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
    
    const [sessionConfig, semesterConfig] = await Promise.all([
        prisma.schoolConfig.findFirst({ where: { key: "sessionYear" } }),
        prisma.schoolConfig.findFirst({ where: { key: "currentSemester" } }),
    ]);
    if (sessionConfig?.value) currentSession = sessionConfig.value;
    if (semesterConfig?.value) currentSemester = semesterConfig.value;

    // Fetch archived attendance sessions for admin & teacher
    let archivedSessionsData: any[] = [];
    let academicSessionsList: string[] = [];

    if (role === "admin" || role === "teacher") {
        const sessions = await prisma.attendanceSession.findMany({
            orderBy: { startTime: "desc" },
            include: {
                lesson: {
                    include: {
                        subject: true,
                        class: {
                            include: {
                                students: {
                                    where: { isActive: true },
                                    select: { id: true, name: true, surname: true, username: true }
                                }
                            }
                        }
                    }
                },
                attendances: {
                    select: { studentId: true, date: true, present: true }
                }
            }
        });

        // Unique academic sessions list
        const sessionsSet = new Set<string>();
        if (currentSession) sessionsSet.add(currentSession);

        sessions.forEach((s) => {
            if (s.academicSession) sessionsSet.add(s.academicSession);
        });
        academicSessionsList = Array.from(sessionsSet);

        archivedSessionsData = sessions.map((session) => {
            const classStudents = session.lesson?.class?.students || [];
            const attendanceMap = new Map<string, { present: boolean; date?: Date }>();

            session.attendances.forEach((att) => {
                attendanceMap.set(att.studentId, { present: att.present, date: att.date });
            });

            const attendees = classStudents.map((student) => {
                const record = attendanceMap.get(student.id);
                return {
                    id: student.id,
                    name: student.name,
                    surname: student.surname,
                    username: student.username,
                    present: record ? record.present : false,
                    time: record && record.date ? new Date(record.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : undefined
                };
            });

            const presentCount = attendees.filter((a) => a.present).length;
            const totalStudents = classStudents.length || attendees.length;
            const absentCount = Math.max(0, totalStudents - presentCount);
            const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

            const semesterName = session.semester === 1
                ? "Harmattan Semester"
                : session.semester === 2
                ? "Rain Semester"
                : currentSemester === "1"
                ? "Harmattan Semester"
                : "Rain Semester";

            return {
                id: session.id,
                courseCode: session.lesson?.subject?.name || "Unknown Course",
                courseTitle: session.lesson?.subject?.title || "",
                levelName: session.lesson?.class?.name || "Unassigned Level",
                date: session.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                startTime: session.startTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
                endTime: session.endTime ? session.endTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Active / Open",
                academicSession: session.academicSession || currentSession,
                semester: semesterName,
                status: session.status,
                totalStudents,
                presentCount,
                absentCount,
                attendancePercentage,
                attendees
            };
        });
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

    if (role === "admin" || role === "teacher") {
        tabs.push({
            id: "archive",
            label: "Attendance Archive",
            icon: "archive",
            content: (
                <AttendanceArchiveSettings
                    archivedSessions={archivedSessionsData}
                    academicSessionsList={academicSessionsList}
                />
            ),
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
                            Manage your profile, attendance archives, appearance, and school configuration
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
