import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { config } from "../../config/env";
import { ZodError } from "zod";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = (req.headers["x-request-id"] as string) || (req as any).id;
  const userId = (req as any).user?.userId;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message,
    }));

    logger.warn(
      "Validation error",
      {
        errors: validationErrors,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(400).json({
      error: "Validation Error",
      message: "Invalid input data",
      code: "VALIDATION_ERROR",
      details: validationErrors,
      requestId,
    });
    return;
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    logger.warn(
      "Application error",
      {
        message: err.message,
        statusCode: err.statusCode,
        code: err.code,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(err.statusCode).json({
      error: "Application Error",
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
      requestId,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    logger.security(
      "Invalid JWT token",
      {
        error: err.message,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(401).json({
      error: "Authentication Error",
      message: "Invalid token",
      code: "INVALID_TOKEN",
      requestId,
    });
  }

  if (err.name === "TokenExpiredError") {
    logger.security(
      "Expired JWT token",
      {
        error: err.message,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(401).json({
      error: "Authentication Error",
      message: "Token expired",
      code: "TOKEN_EXPIRED",
      requestId,
    });
  }

  // Handle Prisma errors
  if (err.code === "P2002") {
    logger.warn(
      "Database constraint violation",
      {
        error: err.message,
        constraint: err.meta?.target,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(409).json({
      error: "Conflict Error",
      message: "Resource already exists",
      code: "RESOURCE_EXISTS",
      requestId,
    });
  }

  if (err.code === "P2025") {
    logger.warn(
      "Database record not found",
      {
        error: err.message,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(404).json({
      error: "Not Found Error",
      message: "Resource not found",
      code: "RESOURCE_NOT_FOUND",
      requestId,
    });
  }

  // Handle other database errors
  if (err.code && err.code.startsWith("P")) {
    logger.error(
      "Database error",
      {
        error: err.message,
        code: err.code,
        path: req.path,
        method: req.method,
      },
      { requestId, userId },
    );

    res.status(500).json({
      error: "Database Error",
      message: "Database operation failed",
      code: "DATABASE_ERROR",
      requestId,
    });
  }

  // Handle unexpected errors
  logger.error(
    "Unexpected error",
    {
      error: err.message,
      stack: config.isDevelopment ? err.stack : undefined,
      path: req.path,
      method: req.method,
    },
    { requestId, userId },
  );

  res.status(500).json({
    error: "Internal Server Error",
    message: config.isDevelopment
      ? err.message
      : "An unexpected error occurred",
    code: "INTERNAL_ERROR",
    ...(config.isDevelopment && { stack: err.stack }),
    requestId,
  });
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = (req.headers["x-request-id"] as string) || (req as any).id;

  logger.warn(
    "Route not found",
    {
      path: req.path,
      method: req.method,
      ip: req.ip,
    },
    { requestId },
  );

  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND",
    requestId,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
