"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { OrgMetadata, InstitutionType } from "@/types/organization";

interface OrgMetadataContextValue {
  institutionType: InstitutionType;
  metadata: Partial<OrgMetadata> | null;
  orgName?: string;
  sessionYear?: string;
  currentSemester?: string;
  semesterText?: string;
}

const OrgMetadataContext = createContext<OrgMetadataContextValue>({
  institutionType: "UNIVERSITY_DEPARTMENT",
  metadata: null,
  orgName: undefined,
  sessionYear: undefined,
  currentSemester: undefined,
  semesterText: undefined,
});

/**
 * Provides org metadata (from Prisma, passed as server prop) to all
 * dashboard client components. This avoids each component independently
 * hitting the DB or Clerk for org config.
 */
export function OrgMetadataProvider({
  children,
  institutionType,
  metadata,
  orgName,
  sessionYear,
  currentSemester,
  semesterText,
}: {
  children: ReactNode;
  institutionType: InstitutionType;
  metadata: Partial<OrgMetadata> | null;
  orgName?: string;
  sessionYear?: string;
  currentSemester?: string;
  semesterText?: string;
}) {
  return (
    <OrgMetadataContext.Provider value={{ institutionType, metadata, orgName, sessionYear, currentSemester, semesterText }}>
      {children}
    </OrgMetadataContext.Provider>
  );
}

/**
 * Read org metadata from the nearest OrgMetadataProvider.
 * Use in client components that need navItems, features, etc.
 */
export function useOrgMetadata(): OrgMetadataContextValue {
  return useContext(OrgMetadataContext);
}
