import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobalInternal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const getClient = () => {
  if (!globalThis.prismaGlobalInternal) {
    globalThis.prismaGlobalInternal = prismaClientSingleton();
  }
  return globalThis.prismaGlobalInternal;
}

const prismaBase = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get(target, prop) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop);

    // Ignore Next.js / Webpack static probes to prevent premature instantiation
    if (prop === 'then' || prop === '__esModule' || prop === '$$typeof' || prop === 'prototype' || prop === 'toJSON' || prop === 'toString' || prop === 'valueOf') {
      return Reflect.get(target, prop);
    }

    const client = getClient();
    const value = Reflect.get(client, prop);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export default prismaBase;
