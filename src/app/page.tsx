import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LandingNavbar from "@/components/LandingNavbar";

export default function Homepage() {
    const { userId, sessionClaims } = auth();
    console.log(`Homepage: Role=${(sessionClaims?.metadata as any)?.role}, UserId=${userId}`);

    // role is typed as string | undefined in metadata, but we cast to be safe
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (userId && role) {
        redirect(`/${role}`);
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <LandingNavbar />
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Lama Dev School</h1>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
                        <p className="font-semibold text-blue-700">Account Created</p>
                        <p className="text-sm text-blue-600 mt-1">Your sign-in was successful.</p>
                    </div>

                    <p className="mb-6 text-gray-600">
                        However, your account does not have a specific role assigned (Admin, Teacher, Student, etc.) yet.
                    </p>

                    <p className="text-sm text-gray-500">
                        Please contact the system administrator to update your permissions.
                    </p>
                </div>
            </div>
        </div>
    );
}
