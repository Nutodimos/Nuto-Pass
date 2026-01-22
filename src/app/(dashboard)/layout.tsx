import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex">
      {/* LEFT - Modern Sidebar (hidden on mobile, hamburger in navbar instead) */}
      <Sidebar />

      {/* RIGHT - Main Content */}
      <div className="flex-1 bg-[#F7F8FA] overflow-y-auto overflow-x-hidden flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
