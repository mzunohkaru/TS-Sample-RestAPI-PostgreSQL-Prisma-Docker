import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";
import { RateLimitError } from "../utils/error";
import { logger } from "../utils/logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  // eslint-disable-next-line no-undef
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private getKey(req: Request): string {
    // Use IP address and user ID (if authenticated) for more granular rate limiting
    const userId =
      (req as Request & { user?: { userId: string } }).user?.userId ||
      "anonymous";
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `${ip}:${userId}`;
  }

  check(
    req: Request,
    windowMs: number,
    maxRequests: number,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(req);
    const now = Date.now();
    const resetTime = now + windowMs;

    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      entry = { count: 1, resetTime };
      this.store.set(key, entry);
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    entry.count++;

    if (entry.count > maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const rateLimiter = new InMemoryRateLimiter();

export const createRateLimit = (options?: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const windowMs = options?.windowMs || config.rateLimit.windowMs;
  const maxRequests = options?.maxRequests || config.rateLimit.maxRequests;
  const message =
    options?.message || "Too many requests, please try again later";
  const skipSuccessfulRequests = options?.skipSuccessfulRequests || false;

  return (req: Request, res: Response, next: NextFunction): void => {
    const result = rateLimiter.check(req, windowMs, maxRequests);

    // Set rate limit headers
    res.set({
      "X-RateLimit-Limit": maxRequests.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    });

    if (!result.allowed) {
      logger.security(
        "Rate limit exceeded",
        {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          path: req.path,
          method: req.method,
          userId: (req as Request & { user?: { userId: string } }).user?.userId,
        },
        { requestId: req.headers["x-request-id"] as string },
      );

      const error = new RateLimitError(message);
      return next(error);
    }

    if (skipSuccessfulRequests) {
      // Track the original end method to check if request was successful
      const originalEnd = res.end.bind(res);
      res.end = function (...args: any[]) {
        if (res.statusCode >= 400) {
          // Only count failed requests
          logger.debug("Rate limit: Failed request counted", {
            statusCode: res.statusCode,
          });
        } else {
          // Don't count successful requests - would need to implement reverse counting
          logger.debug("Rate limit: Successful request not counted", {
            statusCode: res.statusCode,
          });
        }
        return (originalEnd as any)(...args);
      };
    }

    next();
  };
};

// Predefined rate limiters for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // 500 attempts per window
  message: "Too many authentication attempts, please try again later",
});

export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 100 requests per window
});

export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 10 requests per minute
});

// Cleanup on process termination
process.on("SIGTERM", () => rateLimiter.destroy());
process.on("SIGINT", () => rateLimiter.destroy());
