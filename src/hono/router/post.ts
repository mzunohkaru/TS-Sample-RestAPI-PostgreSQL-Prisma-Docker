import { Hono } from "hono";

const postRouter = new Hono();

postRouter.get("/", async (c) => {
  return c.json({ message: "Hello, post!" });
});

export default postRouter;
export type AppType = typeof postRouter;