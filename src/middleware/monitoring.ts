import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

interface RequestMetrics {
  startTime: number;
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
}

// In-memory storage for request metrics (in production, use Redis or similar)
const activeRequests = new Map<string, RequestMetrics>();

/**
 * Request ID middleware - Adds unique request ID to each request
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();

  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
};

/**
 * Request logging and metrics middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();
  const requestId = req.headers["x-request-id"] as string;

  const metrics: RequestMetrics = {
    startTime,
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"],
  };

  // Store metrics for this request
  activeRequests.set(requestId, metrics);

  // Store start time in response locals for duration calculation
  res.locals.startTime = startTime;

  logger.info(
    "Request started",
    {
      method: req.method,
      url: req.url,
      ip: metrics.ip,
      userAgent: metrics.userAgent,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      hasBody: req.method !== "GET" && Object.keys(req.body || {}).length > 0,
    },
    { requestId },
  );

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (body: any) {
    const duration = Date.now() - startTime;

    logger.info(
      "Request completed",
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(body).length,
      },
      { requestId },
    );

    // Clean up metrics
    activeRequests.delete(requestId);

    return originalJson.call(this, body);
  };

  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = req.headers["x-request-id"] as string;
  const startTime = Date.now();

  // Set up performance markers
  res.locals.performanceMarkers = {
    requestStart: startTime,
    middlewareEnd: 0,
    controllerEnd: 0,
    responseEnd: 0,
  };

  // Monitor memory usage
  const memUsage = process.memoryUsage();
  res.locals.initialMemory = memUsage;

  logger.debug(
    "Performance monitoring started",
    {
      initialMemory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
    },
    { requestId },
  );

  // Override res.end to capture final metrics
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const finalMemUsage = process.memoryUsage();

    // Calculate memory delta
    const memoryDelta = {
      rss: finalMemUsage.rss - res.locals.initialMemory.rss,
      heapUsed: finalMemUsage.heapUsed - res.locals.initialMemory.heapUsed,
      heapTotal: finalMemUsage.heapTotal - res.locals.initialMemory.heapTotal,
    };

    logger.info(
      "Performance metrics",
      {
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        memoryDelta: {
          rss: `${Math.round(memoryDelta.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryDelta.heapTotal / 1024 / 1024)}MB`,
        },
        finalMemory: {
          rss: `${Math.round(finalMemUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(finalMemUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(finalMemUsage.heapTotal / 1024 / 1024)}MB`,
        },
      },
      { requestId },
    );

    // Log slow requests
    if (duration > 1000) {
      logger.warn(
        "Slow request detected",
        {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          statusCode: res.statusCode,
        },
        { requestId },
      );
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Health check endpoint
 */
export const healthCheck = (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    activeRequests: activeRequests.size,
    nodeVersion: process.version,
    pid: process.pid,
  };

  logger.debug("Health check requested", health);

  res.status(200).json(health);
};

/**
 * Metrics endpoint for monitoring tools
 */
export const metricsEndpoint = (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();

  // Calculate CPU usage (simplified)
  const cpuUsage = process.cpuUsage();

  const metrics = {
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    activeRequests: activeRequests.size,
    requests: {
      active: Array.from(activeRequests.values()).map((req) => ({
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration: Date.now() - req.startTime,
        ip: req.ip,
      })),
    },
  };

  res.status(200).json(metrics);
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers["x-request-id"] as string;

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error(
          "Request timeout",
          {
            method: req.method,
            url: req.url,
            timeout: `${timeoutMs}ms`,
          },
          { requestId },
        );

        res.status(408).json({
          success: false,
          error: "Request timeout",
          code: "REQUEST_TIMEOUT",
          meta: {
            requestId,
            timeout: timeoutMs,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on("finish", () => {
      clearTimeout(timeout);
    });

    res.on("close", () => {
      clearTimeout(timeout);
    });

    next();
  };
};
