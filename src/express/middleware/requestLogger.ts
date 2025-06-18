import { Request, Response, NextFunction } from "express";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

export interface RequestWithId extends Request {
  id: string;
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();
  const requestId = uuidv4();

  // Add request ID to request object
  (req as RequestWithId).id = requestId;

  // Add request ID to headers for client reference
  res.setHeader("X-Request-ID", requestId);

  // Log incoming request
  logger.info(
    "Incoming request",
    {
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      userId: (req as any).user?.userId,
    },
    { requestId },
  );

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - start;

    // Log response
    logger.info(
      "Request completed",
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.userId,
      },
      { requestId },
    );

    // Log performance warning for slow requests
    if (duration > 1000) {
      logger.warn(
        "Slow request detected",
        {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
        },
        { requestId },
      );
    }

    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};
