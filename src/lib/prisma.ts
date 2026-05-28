import { getDbForRole } from './tenant';
import prismaBase from './prisma-base';

/**
 * Proxy for the Prisma client to provide automatic multi-tenancy.
 * 
 * In server components, actions, and API routes, this proxy will automatically
 * call `getDbForRole()` to return a tenant-scoped Prisma client based on the
 * current user's session metadata. 
 * 
 * If `getDbForRole()` fails (e.g., in a non-request context like a seed script, 
 * or if auth throws), it falls back to the unrestricted raw `prismaBase` client.
 */
const prisma = new Proxy({} as typeof prismaBase, {
  get(target, prop) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop);

    // Ignore Next.js / Webpack static probes to prevent premature instantiation
    if (
      prop === 'then' ||
      prop === '__esModule' ||
      prop === '$$typeof' ||
      prop === 'prototype' ||
      prop === 'toJSON' ||
      prop === 'toString' ||
      prop === 'valueOf'
    ) {
      return Reflect.get(target, prop);
    }

    try {
      // Attempt to get the tenant-scoped client using Clerk auth
      const client = getDbForRole();
      const value = Reflect.get(client, prop);
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    } catch (error) {
      // Fallback for non-request environments (e.g., seed scripts, cron jobs)
      // or if no org context is found.
      const value = Reflect.get(prismaBase, prop);
      if (typeof value === 'function') {
        return value.bind(prismaBase);
      }
      return value;
    }
  },
});

export default prisma;