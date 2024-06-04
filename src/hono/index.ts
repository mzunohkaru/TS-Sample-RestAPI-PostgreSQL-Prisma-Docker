import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import userRouter from "./router/user";
import postRouter from "./router/post";
import fetchRouter from "./router/fetch";
import { zValidator } from "@hono/zod-validator";
import { RequestHeader } from "../schema/request-headers";

const app = new Hono().basePath("/hono");

app.use(cors());
app.use(logger());
app.use(prettyJSON());
app.notFound((c) => c.text("Not found"));

app.get("/", (c) => c.text("Hello, Hono!"));

app
  .use(
    zValidator("header", RequestHeader, (result, c) => {
      if (!result.success) {
        return c.json({ message: result.error }, 400);
      }
    })
  )
  .onError((err, c) => {
    console.error(err);
    return c.json({ message: err.message }, 500);
  })
  .route("/user", userRouter)
  .route("/post", postRouter)
  .route("/fetch", fetchRouter);

const PORT = 3000;

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Server is running at http://localhost:${PORT}/api`);

export default app;
export type AppType = typeof app;
