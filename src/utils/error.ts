import { Request, Response, NextFunction } from "express";
import { Context } from "hono";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  res.status(500).json({
    message: err.message || "サーバー内部でエラーが発生しました。",
  });
}

export function handlePrismaError(error: unknown, c: Context) {
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
