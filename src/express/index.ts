import express, { Express, Request, Response } from "express";
import * as dotenv from "dotenv";

import userRouter from "./router/user";
import postRouter from "./router/post";
import { errorHandler } from "./middleware/error";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/express/user", userRouter);
app.use("/express/post", postRouter);

// エラーハンドリングミドルウェアを追加
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("Running API 👩‍💻");
});

app.listen(port, () => {
  console.log(`Server is running🚀 http://localhost:${port}/express`);
});
