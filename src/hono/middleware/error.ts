import { Context } from "hono";
import { Prisma } from "@prisma/client";

export function handlePrismaError(error: unknown, c: Context) {
  console.error("Error:", error);
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    return c.json({ message: error.message }, 500);
  }
  return c.json({ message: "Internal server error" }, 500);
}
