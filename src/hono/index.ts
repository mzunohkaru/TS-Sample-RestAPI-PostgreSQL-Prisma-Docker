import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import userRouter from "./router/user";
import postRouter from "./router/post";

const app = new Hono().basePath("/api");

app.use(cors());
app.use(logger());
app.use(prettyJSON());
app.notFound((c) => c.text("Not found"));

app.get("/", (c) => c.text("Hello, Hono!"));

const PORT = 3000;

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Server is running at http://localhost:${PORT}/api`);

app.route("/user", userRouter).route("/post", postRouter);

export default app;
export type AppType = typeof app;
