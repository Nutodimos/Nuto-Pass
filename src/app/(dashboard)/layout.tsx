import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import BottomTabBar from "@/components/BottomTabBar";
import { OrgMetadataProvider } from "@/components/OrgMetadataProvider";
import { getOrgContext } from "@/lib/tenant";
import prisma from "@/lib/prisma-base";
import type { InstitutionType, OrgMetadata } from "@/types/organization";

// Force dynamic rendering so metadata changes are always reflected
export const dynamic = "force-dynamic";

/** Convert hex (#RRGGBB) to "R, G, B" for rgba() usage */
function hexToRgb(hex: string): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "10, 30, 75";
  return `${r}, ${g}, ${b}`;
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ctx = getOrgContext();
  let institutionType: InstitutionType = "UNIVERSITY_DEPARTMENT";
  let metadata: Partial<OrgMetadata> | null = null;

  let orgName: string | undefined = undefined;

  if (ctx.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true, institutionType: true, metadata: true },
    });
    if (org) {
      institutionType = org.institutionType as InstitutionType;
      metadata = (org.metadata as Partial<OrgMetadata>) || null;
      orgName = org.name;
    }
  }

  // Fetch academic session & semester
  const [sessionConfig, semesterConfig] = await Promise.all([
    prisma.schoolConfig.findFirst({
      where: ctx.organizationId ? { organizationId: ctx.organizationId, key: "sessionYear" } : { key: "sessionYear" },
    }),
    prisma.schoolConfig.findFirst({
      where: ctx.organizationId ? { organizationId: ctx.organizationId, key: "currentSemester" } : { key: "currentSemester" },
    }),
  ]);

  const sessionYear = sessionConfig?.value || "2024/25";
  const currentSemester = semesterConfig?.value || "1";
  
  // Format semester/term text dynamically based on institution type
  let semesterText = currentSemester === "1" ? "Harmattan Semester" : "Rain Semester";
  if (institutionType === "SECONDARY_SCHOOL" || institutionType === "PRIMARY_SCHOOL") {
    semesterText = currentSemester === "1" ? "First Term" : currentSemester === "2" ? "Second Term" : "Third Term";
  } else if (institutionType === "TRAINING_CENTER") {
    semesterText = currentSemester === "1" ? "First Session" : "Second Session";
  }

  // Resolve org brand colours (with fallbacks to CPE defaults)
  const primaryColor = metadata?.uiConfig?.primaryColor || "#0A1E4B";
  const accentColor = metadata?.uiConfig?.accentColor || "#B99146";
  const faviconUrl = metadata?.uiConfig?.faviconUrl;
  const siteTitle = metadata?.uiConfig?.sidebarTitle;

  // Inject CSS custom properties directly on the wrapper div
  const themeVars: React.CSSProperties & Record<string, string> = {
    "--org-primary": primaryColor,
    "--org-primary-rgb": hexToRgb(primaryColor),
    "--org-accent": accentColor,
    "--org-accent-rgb": hexToRgb(accentColor),
  } as any;

  return (
    <OrgMetadataProvider
      institutionType={institutionType}
      metadata={metadata}
      orgName={orgName}
      sessionYear={sessionYear}
      currentSemester={currentSemester}
      semesterText={semesterText}
    >
      {/* Dynamic favicon + title */}
      {faviconUrl && <link rel="icon" href={faviconUrl} />}
      {siteTitle && <title>{siteTitle}</title>}

      <div className="h-screen flex" style={themeVars}>
        {/* LEFT - Modern Sidebar */}
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
