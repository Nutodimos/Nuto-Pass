import Table from "@/components/Table";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type ClerkUser = {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: { emailAddress: string }[];
    imageUrl: string;
    createdAt: number;
};

const AdminListPage = async () => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Only admins can view this page
    if (role !== "admin") {
        return redirect("/");
    }

    const columns = [
        {
            header: "Info",
            accessor: "info",
        },
        {
            header: "Email",
            accessor: "email",
            className: "hidden md:table-cell",
        },
        {
            header: "Joined",
            accessor: "createdAt",
            className: "hidden lg:table-cell",
        },
    ];

    // Fetch all users from Clerk and filter by admin role
    const allUsers = await clerkClient().users.getUserList({ limit: 100 });
    const admins = allUsers.data.filter(
        (user) => (user.publicMetadata as { role?: string })?.role === "admin"
    );

    const renderRow = (item: ClerkUser) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-CPENavy/10"
        >
            <td className="flex items-center gap-4 p-4">
                <Image
                    src={item.imageUrl || "/noAvatar.png"}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">
                        {item.firstName} {item.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">@{item.username || "N/A"}</p>
                </div>
            </td>
            <td className="hidden md:table-cell">
                {item.emailAddresses[0]?.emailAddress || "N/A"}
            </td>
            <td className="hidden lg:table-cell">
                {new Date(item.createdAt).toLocaleDateString()}
            </td>
        </tr>
    );

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">All Admins</h1>
                <span className="text-sm text-gray-500">{admins.length} total</span>
            </div>
            {/* LIST */}
            <Table columns={columns} renderRow={renderRow} data={admins as any} />
        </div>
    );
};

export default AdminListPage;
