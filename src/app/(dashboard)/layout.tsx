import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/BottomTabBar";
import { OrgMetadataProvider } from "@/components/OrgMetadataProvider";
import { getOrgContext } from "@/lib/tenant";
import prisma from "@/lib/prisma-base";
import type { InstitutionType, OrgMetadata } from "@/types/organization";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch org metadata from Prisma (server-side) to provide to client components
  const ctx = getOrgContext();
  let institutionType: InstitutionType = "UNIVERSITY_DEPARTMENT";
  let metadata: Partial<OrgMetadata> | null = null;

  if (ctx.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { institutionType: true, metadata: true },
    });
    if (org) {
      institutionType = org.institutionType as InstitutionType;
      metadata = (org.metadata as Partial<OrgMetadata>) || null;
    }
  }

  return (
    <OrgMetadataProvider institutionType={institutionType} metadata={metadata}>
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
    </OrgMetadataProvider>
  );
}
