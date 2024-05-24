import { Context } from "hono";

import prisma from "../../../utils/db";

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
    return c.json({ message: "Internal server error" }, 500);
  }
};

export const getUserById = async (c: Context) => {
  const id = c.req.param("id");
  const user = await prisma.user.findFirst({
    where: { id: Number(id) },
    include: {
      posts: true,
    },
  });
  return c.json(user, 200);
};
