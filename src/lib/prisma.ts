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

const prisma = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get(target, prop) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop);
    if (['then', '__esModule', '$$typeof', 'prototype', 'toJSON', 'toString', 'valueOf'].includes(prop)) {
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

export default prisma;