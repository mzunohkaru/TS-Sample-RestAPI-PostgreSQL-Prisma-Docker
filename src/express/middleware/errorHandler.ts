import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError, NotFoundError } from "../../utils/error";
import { logger } from "../../utils/logger";

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    validation?: any;
  };
  meta: {
    requestId: string;
    timestamp: string;
    path: string;
    method: string;
  };
  stack?: string;
}

/**
 * Comprehensive error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = (req.headers["x-request-id"] as string) || "unknown";
  const isProduction = process.env.NODE_ENV === "production";

  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_SERVER_ERROR";
  let details: any = undefined;
  let validation: any = undefined;

  // Log error details
  logger.error(
    "Error occurred during request processing",
    {
      error: error.message,
      stack: error.stack,
      name: error.constructor.name,
      method: req.method,
      url: req.url,
      body: req.method !== "GET" ? "[REDACTED]" : undefined,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
    { requestId },
  );

  // Handle different error types
  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || "APP_ERROR";
    details = error.details;

    logger.warn(
      "Application error",
      {
        code,
        message,
        statusCode,
        details,
      },
      { requestId },
    );
  } else if (error instanceof ZodError) {
    // Zod validation errors
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    validation = error.flatten();

    logger.warn(
      "Validation error",
      {
        code,
        validation,
      },
      { requestId },
    );
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma database errors
    statusCode = 400;
    code = "DATABASE_ERROR";

    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        statusCode = 409;
        message = "Resource already exists";
        code = "UNIQUE_CONSTRAINT_VIOLATION";
        details = {
          fields: error.meta?.target,
          constraint: "unique",
        };
        break;

      case "P2025":
        // Record not found
        statusCode = 404;
        message = "Resource not found";
        code = "RECORD_NOT_FOUND";
        break;

      case "P2003":
        // Foreign key constraint violation
        statusCode = 400;
        message = "Invalid reference to related resource";
        code = "FOREIGN_KEY_CONSTRAINT_VIOLATION";
        details = {
          field: error.meta?.field_name,
          constraint: "foreign_key",
        };
        break;

      case "P2014":
        // Required relation violation
        statusCode = 400;
        message = "Invalid data: missing required relation";
        code = "REQUIRED_RELATION_VIOLATION";
        break;

      default:
        message = "Database operation failed";
        details = {
          code: error.code,
          meta: error.meta,
        };
    }

    logger.error(
      "Database error",
      {
        code,
        prismaCode: error.code,
        message,
        meta: error.meta,
      },
      { requestId },
    );
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    // Unknown Prisma errors
    statusCode = 500;
    message = "Database error occurred";
    code = "DATABASE_UNKNOWN_ERROR";

    logger.error(
      "Unknown database error",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    // Prisma engine panic
    statusCode = 500;
    message = "Database engine error";
    code = "DATABASE_ENGINE_ERROR";

    logger.error(
      "Database engine panic",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    // Prisma initialization error
    statusCode = 500;
    message = "Database connection error";
    code = "DATABASE_CONNECTION_ERROR";

    logger.error(
      "Database connection error",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation error
    statusCode = 400;
    message = "Invalid database query";
    code = "DATABASE_VALIDATION_ERROR";

    logger.error(
      "Database validation error",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else if (error.name === "JsonWebTokenError") {
    // JWT errors
    statusCode = 401;
    message = "Invalid authentication token";
    code = "INVALID_TOKEN";

    logger.warn(
      "JWT error",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else if (error.name === "TokenExpiredError") {
    // JWT expiration
    statusCode = 401;
    message = "Authentication token expired";
    code = "TOKEN_EXPIRED";

    logger.warn(
      "Token expired",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else if (error.name === "SyntaxError" && error.message.includes("JSON")) {
    // JSON parsing errors
    statusCode = 400;
    message = "Invalid JSON in request body";
    code = "INVALID_JSON";

    logger.warn(
      "JSON parsing error",
      {
        code,
        message: error.message,
      },
      { requestId },
    );
  } else {
    // Unknown errors
    logger.error(
      "Unknown error",
      {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      { requestId },
    );
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      ...(details && { details }),
      ...(validation && { validation }),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  // Include stack trace in development
  if (!isProduction && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Security headers for error responses
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = (req.headers["x-request-id"] as string) || "unknown";

  logger.warn(
    "Route not found",
    {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    },
    { requestId },
  );

  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
};

/**
 * Global uncaught exception handler
 */
export const setupGlobalErrorHandlers = () => {
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Give the logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on("unhandledRejection", (reason: unknown, promise: Promise<any>) => {
    logger.error("Unhandled Rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });

    // Give the logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
  });
};
