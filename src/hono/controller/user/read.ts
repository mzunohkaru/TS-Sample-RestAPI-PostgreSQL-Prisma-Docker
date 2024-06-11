import { Context } from "hono";

import { handlePrismaError } from "../../middleware/error";
import { prismaClient } from "../../../utils/db";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
});

export const getUsers = async (c: Context) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        posts: true,
      },
    });
    return c.json(users, 200);
  } catch (error) {
    // TODO:Error Throw
    return handlePrismaError(error, c);
  }
};

export const getUserById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const user = await prismaClient.user.findFirst({
      where: { id: Number(id) },
      include: {
        posts: true,
      },
    });
    return c.json(user, 200);
  } catch (error) {
    return handlePrismaError(error, c);
  }
};
