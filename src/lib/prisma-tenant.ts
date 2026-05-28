import prisma from '@/lib/prisma-base';

/**
 * Creates a tenant-scoped Prisma Client via the $extends API.
 * Every query made through the returned client will automatically
 * have `organizationId` injected — preventing cross-tenant data leaks.
 *
 * SUPER_ADMIN bypasses this and uses the raw `prisma` client directly.
 */
export function getTenantClient(organizationId: string) {
  const client = prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async findFirst({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async findUnique({ args, query }: any) {
          // findUnique uses unique fields only; we can't inject where
          // but we verify the result belongs to the org after query
          const result = await query(args);
          if (result && (result as any).organizationId && (result as any).organizationId !== organizationId) {
            return null; // cross-tenant — hide
          }
          return result;
        },
        async update({ args, query }: any) {
          // For compound where clauses, spread organizationId
          if (args.where) {
            args.where = { ...args.where, organizationId };
          }
          return query(args);
        },
        async updateMany({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async delete({ args, query }: any) {
          if (args.where) {
            args.where = { ...args.where, organizationId };
          }
          return query(args);
        },
        async deleteMany({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async create({ args, query }: any) {
          if (args.data) {
            args.data.organizationId = organizationId;
          }
          return query(args);
        },
        async createMany({ args, query }: any) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((d: any) => ({ ...d, organizationId }));
          } else if (args.data) {
            args.data.organizationId = organizationId;
          }
          return query(args);
        },
        async upsert({ args, query }: any) {
          if (args.where) {
            args.where = { ...args.where, organizationId };
          }
          if (args.create) {
            (args.create as any).organizationId = organizationId;
          }
          return query(args);
        },
        async count({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async aggregate({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
        async groupBy({ args, query }: any) {
          args.where = { ...args.where, organizationId };
          return query(args);
        },
      },
    },
  });
  return client as unknown as typeof prisma;
}
