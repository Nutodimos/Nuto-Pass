import BiometricHub from "@/components/BiometricHub";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Biometric Management | NutoPass",
    description: "Manage your R307 fingerprint sensor and student enrollment.",
};

const BiometricsPage = () => {
    return (
        <div className="bg-slate-50/50 min-h-screen">
            <BiometricHub />
        </div>
    );
};

export default BiometricsPage;
