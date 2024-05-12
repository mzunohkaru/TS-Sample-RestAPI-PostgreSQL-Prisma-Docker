import express from "express";
import * as dotenv from "dotenv";

import userRouter from "./router/user";
import postRouter from "./router/post";
import errorHandler from "./middleware/error";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/user", userRouter);
app.use("/post", postRouter);

// エラーハンドリングミドルウェアを追加
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Running API 👩‍💻");
});

app.listen(port, () => {
  console.log(`Server is running🚀 http://localhost:${port}`);
});

