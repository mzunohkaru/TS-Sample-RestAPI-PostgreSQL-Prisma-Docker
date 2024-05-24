import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { CreateUserSchema, LoginUserSchema } from "../../schema/user";
import { createUser, loginUser } from "../controller/user/create";
import { getUsers, getUserById } from "../controller/user/read";

const userRouter = new Hono()
  .post(
    "/register",
    zValidator("json", CreateUserSchema, (result, c) => {
      if (!result.success) {
        return c.json({ message: result.error }, 400);
      }
    }),
    createUser
  )
  .post(
    "/login",
    zValidator("json", LoginUserSchema, (result, c) => {
      if (!result.success) {
        return c.json({ message: result.error }, 400);
      }
    }),
    loginUser
  )
  .get("/", getUsers)
  .get("/:id", getUserById);

export default userRouter;
export type AppType = typeof userRouter;
