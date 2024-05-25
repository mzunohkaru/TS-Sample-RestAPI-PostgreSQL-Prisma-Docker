import { Hono } from "hono";

import { CreateUserSchema, LoginUserSchema } from "../../schema/user";
import { getFetcher, postFetcher } from "../../utils/fetch";

const url = "http://localhost:3000/api";

const fetchRouter = new Hono()
  .post("/user/register", async (c) => {
    const body = await c.req.json<CreateUserSchema>();
    const data = await postFetcher<CreateUserSchema, CreateUserSchema>(`${url}/user/register`, body, {
      headers: {
        "X-API-KEY": "1234567890",
      },
    });
    return c.json({ data: data });
  })
  .post("/user/login", async (c) => {
    const body = await c.req.json<LoginUserSchema>();
    const data = await postFetcher<LoginUserSchema, LoginUserSchema>(`${url}/user/login`, body, {
      headers: {
        "X-API-KEY": "1234567890",
      },
    });
    return c.json({ data: data });
  })
  .get("/user", async (c) => {
    const data = await getFetcher(
      `${url}/user`,
      {},
      {
        headers: {
          "X-API-KEY": "1234567890",
        },
      }
    );
    return c.json({ data: data });
  })
  .get("/user/:id", async (c) => {
    const userId = c.req.param("id");
    const data = await getFetcher(
      `${url}/user/${userId}`,
      {},
      {
        headers: {
          "X-API-KEY": "1234567890",
        },
      }
    );
    return c.json({ data: data });
  })
  .get("/post", async (c) => {
    const data = await getFetcher(
      `${url}/post`,
      {},
      {
        headers: {
          "X-API-KEY": "1234567890",
        },
      }
    );
    return c.json({ data: data });
  });

export default fetchRouter;
export type AppType = typeof fetchRouter;
