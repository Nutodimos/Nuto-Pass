import { clerkClient } from '@clerk/nextjs/server';

/**
 * Sets role and organization metadata on a Clerk user's public metadata.
 * This metadata is included in the session JWT so middleware can read it
 * without making a DB call on every request.
 *
 * Call this when:
 * - A user is assigned to an org
 * - A user's role changes
 * - A user is removed from an org
 */
export async function setClerkUserMetadata(
  clerkUserId: string,
  data: {
    role: string;
    organizationId?: string | null;
    orgSlug?: string | null;
  }
) {
  await clerkClient().users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      role: data.role,
      organizationId: data.organizationId ?? null,
      orgSlug: data.orgSlug ?? null,
    },
  });
}
