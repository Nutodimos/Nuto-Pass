import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/BottomTabBar";

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
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Bottom Tab Navigation (mobile only) */}
      <BottomTabBar />
    </div>
  );
}

