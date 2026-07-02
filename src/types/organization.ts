/**
 * Organization metadata types for Domain-Adaptive UI.
 *
 * These types describe the shape of the `metadata` JSON field on the
 * Prisma Organization model. They drive institution-specific UI
 * configuration, taxonomy, navigation, and feature flags.
 */

export type InstitutionType =
  | 'SECONDARY_SCHOOL'
  | 'UNIVERSITY_DEPARTMENT'
  | 'TRAINING_CENTER'
  | 'PRIMARY_SCHOOL';

export interface NavItem {
  /** Display label, or a taxonomy key like "Taxonomy.student" */
  label: string;
  /** Route path, e.g. "/list/students" */
  href: string;
  /** Lucide icon name, e.g. "Home", "Users", "GraduationCap" */
  icon: string;
}

export interface OrgMetadata {
  institutionType: InstitutionType;
  uiConfig: {
    /** Hex brand colour, e.g. "#0A1E4B" — overrides CPENavy for this org */
    primaryColor?: string;
    /** Secondary accent colour, e.g. "#B99146" — overrides CPEGold */
    accentColor?: string;
    /** URL to organisation logo (uploaded via super-admin) */
    logoUrl?: string;
    /** URL to custom favicon (uploaded via super-admin) */
    faviconUrl?: string;
    /** Display name shown in sidebar header & page title, e.g. "Covenant Engineering" */
    sidebarTitle?: string;
    /** Welcome / tagline text shown on dashboard, e.g. "Welcome to the portal" */
    welcomeText?: string;
    /** Custom sidebar navigation items — overrides hardcoded defaults */
    navItems: NavItem[];
    /** Custom mobile bottom tab items (max 4 + "More") */
    bottomTabItems?: NavItem[];
  };
  features: {
    hasResults: boolean;
    hasHostels: boolean;
    hasBiometrics: boolean;
    hasAssignments: boolean;
    hasMaterials: boolean;
    gradingScale: 'PERCENTAGE' | 'GPA_4_0' | 'GPA_5_0';
  };
}
