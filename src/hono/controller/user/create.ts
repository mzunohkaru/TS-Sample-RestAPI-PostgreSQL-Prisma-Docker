import { Context } from "hono";

import { CreateUserSchema, LoginUserSchema } from "../../../schema/user";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { handlePrismaError } from "../../middleware/error";
import prisma from "../../../utils/db";

export const createUser = async (c: Context) => {
  try {
    const body = await c.req.json<CreateUserSchema>();
    console.log("req", body);

    const { name, email, password } = body;
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    return c.json(user, 200);
  } catch (error) {
    return handlePrismaError(error, c);
  }
};

export const loginUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json<LoginUserSchema>();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return c.json({ message: "User not found" }, 404);
    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) return c.json({ message: "Invalid password" }, 401);
    return c.json({ message: "Login successful" }, 200);
  } catch (error) {
    return handlePrismaError(error, c);
  }
};
