import type { OrgMetadata } from './organization';

/**
 * Extend Clerk's JWT session claims so TypeScript recognises
 * the custom `org_metadata` field injected via the Clerk Dashboard
 * session token template:
 *   { "org_metadata": "{{organization.public_metadata}}" }
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: string;
      organizationId?: string;
      orgSlug?: string;
    };
    org_metadata?: OrgMetadata;
  }
}

export {};
