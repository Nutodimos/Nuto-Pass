import SettingsForm from "@/components/forms/SettingsForm";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
        return redirect("/");
    }

    // Fetch current session year
    const sessionConfig = await prisma.schoolConfig.findUnique({
        where: { key: "sessionYear" },
    });

    const currentSession = sessionConfig?.value || "2024/25";

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <h1 className="text-xl font-semibold mb-4">School Settings</h1>

            <div className="flex flex-col gap-4 max-w-md">
                <SettingsForm currentSession={currentSession} />
            </div>
        </div>
    );
};

export default SettingsPage;
