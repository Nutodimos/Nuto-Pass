import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function LandingNavbar() {
    return (
        <header className="flex justify-between items-center p-4 h-24 bg-transparent z-50 relative animate-in slide-in-from-top-4 duration-700 ease-out">
            <Link href="/" className="flex items-center gap-4 group">
                <div className="relative w-16 h-16 transition-transform group-hover:scale-110 duration-300">
                    <Image src="/nutopass-logo.png" alt="NutoPass Logo" fill className="object-contain mix-blend-multiply" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-gray-800 group-hover:text-nutoSlate transition-colors">NutoPass</span>
            </Link>

            <div className="flex items-center gap-4 animate-in fade-in duration-1000 delay-300">
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </header>
    );
}
