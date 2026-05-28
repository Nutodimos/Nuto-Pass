/**
 * Organization metadata types for Domain-Adaptive UI.
 *
 * These types describe the shape of Clerk Organization `publicMetadata`
 * that drives institution-specific UI configuration, taxonomy, navigation,
 * and feature flags — without hitting the database.
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
    primaryColor?: string;
    logoUrl?: string;
    navItems: NavItem[];
  };
  features: {
    hasResults: boolean;
    hasHostels: boolean;
    gradingScale: 'PERCENTAGE' | 'GPA_4_0' | 'GPA_5_0';
  };
}
