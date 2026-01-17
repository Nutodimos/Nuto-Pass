"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuLinkProps {
    item: {
        icon: string;
        label: string;
        href: string;
    };
}

const MenuLink = ({ item }: MenuLinkProps) => {
    const pathname = usePathname();

    // Active if exact match for root, or starts with for other routes
    const isActive =
        item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

    return (
        <Link
            href={item.href}
            className={`flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors ${isActive
                    ? "bg-nutoSlate/10 text-nutoSlate"
                    : "text-gray-500 hover:bg-nutoSlate/10 hover:text-nutoSlate"
                }`}
        >
            <Image src={item.icon} alt="" width={20} height={20} />
            <span className="hidden lg:block">{item.label}</span>
            {/* Optional: Add an active indicator like a small dot or border if desired, but color change is usually enough */}
        </Link>
    );
};

export default MenuLink;
