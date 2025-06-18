import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import * as dotenv from "dotenv";

// Enhanced routers
import userRouter from "./router/user.enhanced";
import postRouter from "./router/post";
import authRouter from "./router/auth";

// Enhanced middleware
import {
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
} from "./middleware/errorHandler";
import {
  requestId,
  requestLogger,
  performanceMonitor,
  healthCheck,
  metricsEndpoint,
} from "./middleware/monitoring";
import { generalRateLimit } from "./middleware/rateLimit";
import { sanitizeInput } from "./middleware/validation";

import { config } from "./config/env";
import { logger } from "./utils/logger";

dotenv.config();

const app: Express = express();
const port = config.port;

// Setup global error handlers
setupGlobalErrorHandlers();

// Trust proxy for accurate IP addresses behind load balancers
app.set("trust proxy", 1);

// Remove X-Powered-By header for security
app.disable("x-powered-by");

// Enhanced security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// Enhanced CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (config.isDevelopment) {
        return callback(null, true);
      }

      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "X-Forwarded-For",
      "User-Agent",
    ],
    exposedHeaders: [
      "X-Request-ID",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400, // 24 hours
  }),
);

// Global middleware stack (order matters!)
app.use(requestId);
app.use(requestLogger);
app.use(performanceMonitor);

// Request parsing with size limits
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf, encoding) => {
      // JSON bomb protection
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    },
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
    parameterLimit: 100,
  }),
);

// Input sanitization
app.use(sanitizeInput);

// Global rate limiting
app.use(generalRateLimit);

// API documentation endpoint
app.get("/api/docs", (req: Request, res: Response) => {
  res.json({
    name: "Enhanced User Management API",
    version: "1.0.0",
    description: "Senior-level TypeScript REST API with comprehensive features",
    features: [
      "JWT Authentication & Authorization",
      "Advanced Input Validation with Zod",
      "Comprehensive Error Handling",
      "Request/Response Logging",
      "Performance Monitoring",
      "Rate Limiting",
      "Input Sanitization",
      "Pagination & Search",
      "Database Optimization",
      "Type Safety",
      "Security Headers",
      "Health Checks",
      "Metrics Collection",
    ],
    endpoints: {
      health: "/health",
      metrics: "/metrics",
      users: {
        list: "GET /api/users",
        get: "GET /api/users/:id",
        create: "POST /api/users/register",
        update: "PUT /api/users/:id",
        delete: "DELETE /api/users/:id",
        upsert: "POST /api/users/:id",
      },
      auth: {
        login: "POST /api/auth/login",
        refresh: "POST /api/auth/refresh",
      },
    },
    security: {
      rateLimit: "100 requests per 15 minutes",
      authentication: "JWT Bearer tokens",
      authorization: "Resource ownership validation",
      headers: "Comprehensive security headers",
      sanitization: "XSS protection and input cleaning",
    },
  });
});

// Health check endpoint
app.get("/health", healthCheck);

// Metrics endpoint
app.get("/metrics", metricsEndpoint);

// API routes with versioning
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  const requestId = req.headers["x-request-id"] as string;

  logger.info(
    "Root endpoint accessed",
    {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
    { requestId },
  );

  res.json({
    message: "🚀 Enhanced TypeScript REST API",
    version: "1.0.0",
    status: "operational",
    documentation: "/api/docs",
    health: "/health",
    metrics: "/metrics",
    timestamp: new Date().toISOString(),
    requestId,
  });
});

// 404 handler for unmatched routes
app.use("*", notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(port, () => {
  logger.info(`🚀 Enhanced Express Server started`, {
    port,
    environment: config.env,
    nodeVersion: process.version,
    pid: process.pid,
  });

  console.log(`🚀 Enhanced Express Server running at http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${port}/health`);
  console.log(`📊 Metrics: http://localhost:${port}/metrics`);
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, starting graceful shutdown");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, starting graceful shutdown");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

export default app;
