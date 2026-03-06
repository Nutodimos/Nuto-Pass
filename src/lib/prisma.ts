import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get(target, prop, receiver) {
    if (!globalThis.prismaGlobal) {
      globalThis.prismaGlobal = prismaClientSingleton();
    }
    const value = Reflect.get(globalThis.prismaGlobal, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(globalThis.prismaGlobal);
    }
    return value;
  }
});

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;