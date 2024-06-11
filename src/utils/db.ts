import { Prisma, PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};
const prismaSingleton = () => {
  return Prisma;
};

const globalThis = global as typeof global & {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
  prisma?: ReturnType<typeof prismaSingleton>;
};
const prismaClient = globalThis.prismaGlobal ?? prismaClientSingleton();
const prisma = globalThis.prisma ?? prismaSingleton();

export { prismaClient, prisma };

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prismaClient;
  globalThis.prisma = prisma;
}
