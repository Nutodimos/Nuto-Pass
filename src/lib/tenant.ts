import { auth } from '@clerk/nextjs/server';
import { getTenantClient } from './prisma-tenant';
import prisma from './prisma-base';
import type { OrgMetadata } from '@/types/organization';

export type OrgContext = {
  userId: string | null;
  role: string | undefined;
  organizationId: string | undefined;
  orgSlug: string | undefined;
  institutionType: OrgMetadata['institutionType'] | undefined;
  uiConfig: OrgMetadata['uiConfig'] | undefined;
  features: OrgMetadata['features'] | undefined;
};

/**
 * Extract the organisation context from the current Clerk session.
 * Works in Server Components, Server Actions, and Route Handlers.
 *
 * Includes Domain-Adaptive metadata (institutionType, uiConfig, features)
 * read from the JWT's `org_metadata` claim — set via the Clerk Dashboard
 * session token template.
 */
export function getOrgContext(): OrgContext {
  const { userId, sessionClaims } = auth();
  const metadata = sessionClaims?.metadata as {
    role?: string;
    organizationId?: string;
    orgSlug?: string;
  } | undefined;

  const orgMeta = sessionClaims?.org_metadata as OrgMetadata | undefined;

  return {
    userId,
    role: metadata?.role,
    organizationId: metadata?.organizationId,
    orgSlug: metadata?.orgSlug,
    institutionType: orgMeta?.institutionType,
    uiConfig: orgMeta?.uiConfig,
    features: orgMeta?.features,
  };
}

/**
 * Returns a tenant-scoped Prisma client for the current user's org.
 * Throws if no org context is available.
 */
export function getTenantDb() {
  const ctx = getOrgContext();
  if (!ctx.organizationId) {
    throw new Error('No organization context available. User may not be assigned to an org.');
  }
  return getTenantClient(ctx.organizationId);
}

/**
 * Returns the appropriate DB client based on the user's role:
 * - SUPER_ADMIN → raw prisma (unrestricted cross-org access)
 * - Everyone else → tenant-scoped client
 */
export function getDbForRole() {
  const ctx = getOrgContext();
  if (ctx.role === 'super_admin') {
    return prisma; // unrestricted
  }
  if (!ctx.organizationId) {
    throw new Error('No organization context available.');
  }
  return getTenantClient(ctx.organizationId);
}
