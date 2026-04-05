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
        <header className="hidden lg:flex justify-between items-center px-4 sm:px-8 py-3 bg-transparent z-50 relative animate-in slide-in-from-top-4 duration-700 ease-out">
            <Link href="/" className="flex items-center gap-2 md:gap-4 group">
                <div className="relative w-10 h-10 md:w-16 md:h-16 transition-transform group-hover:scale-110 duration-300">
                    <Image src="/cpeautomation-logo.png" alt="CPE Automation Logo" fill className="object-contain mix-blend-multiply" />
                </div>
                <span className="font-extrabold text-lg md:text-2xl tracking-tight text-gray-800 group-hover:text-CPENavy transition-colors">CPE Automation</span>
            </Link>

            <div className="flex items-center gap-4 animate-in fade-in duration-1000 delay-300">
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </header>
    );
}
