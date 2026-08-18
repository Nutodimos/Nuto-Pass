import BiometricHub from "@/components/BiometricHub";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Biometric Management | NutoPass",
    description: "Manage your R307 fingerprint sensor and student enrollment.",
};

const BiometricsPage = () => {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (!userId || (role !== "admin" && role !== "teacher")) {
        redirect("/unauthorized");
    }

    return (
        <div className="bg-slate-50/50 min-h-screen">
            <BiometricHub />
        </div>
    );
};

export default BiometricsPage;
