import { Context } from "hono";
import { prisma } from "../../utils/db";

export function handlePrismaError(error: unknown, c: Context) {
  console.error("Error:", error);
  if (
    error instanceof prisma.PrismaClientKnownRequestError ||
    error instanceof prisma.PrismaClientUnknownRequestError ||
    error instanceof prisma.PrismaClientRustPanicError ||
    error instanceof prisma.PrismaClientValidationError
  ) {
    return c.json({ message: error.message }, 500);
  }
  return c.json({ message: "Internal server error" }, 500);
}
