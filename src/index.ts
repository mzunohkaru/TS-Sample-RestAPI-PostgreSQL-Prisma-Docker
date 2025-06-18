import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import * as dotenv from "dotenv";

import userRouter from "./router/user";
import postRouter from "./router/post";
import authRouter from "./router/auth";
import { errorHandler } from "./middleware/error";
import { requestLogger } from "./middleware/requestLogger";
import { generalRateLimit } from "./middleware/rateLimit";
import { config } from "./config/env";

dotenv.config();

const app: Express = express();
const port = config.port;

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: config.isDevelopment
      ? "*"
      : process.env.ALLOWED_ORIGINS?.split(",") || false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  }),
);

// Request parsing and logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestLogger);

// Global rate limiting
app.use(generalRateLimit);

// API routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Running API 👩‍💻");
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Running Express Server http://localhost:${port}/api`);
});
