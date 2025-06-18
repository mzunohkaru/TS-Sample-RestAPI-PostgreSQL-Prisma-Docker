import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import {
  CreateUserSchema,
  UpdateUserSchema,
  GetUsersQuerySchema,
  GetUserParamsSchema,
} from "../../schema/user";
import { RequestAuthHeaderSchema } from "../../schema/request-headers";

/**
 * Generic validation middleware factory
 * @param schema Zod schema to validate against
 * @param source Where to get data from ('body', 'params', 'query', 'headers')
 */
export const validateSchema = (
  schema: ZodSchema,
  source: "body" | "params" | "query" | "headers" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = req.headers["x-request-id"] as string;
      const data = req[source];

      logger.debug(
        `Validating ${source} data`,
        {
          source,
          hasData: !!data,
        },
        { requestId },
      );

      const result = schema.safeParse(data);

      if (!result.success) {
        const errorDetails = result.error.flatten();

        logger.warn(
          `Validation failed for ${source}`,
          {
            source,
            errors: errorDetails,
            data: source === "body" ? "[REDACTED]" : data,
          },
          { requestId },
        );

        throw new AppError(
          `Invalid ${source} data`,
          400,
          "VALIDATION_ERROR",
          errorDetails.fieldErrors,
        );
      }

      // Replace the original data with the validated and transformed data
      req[source] = result.data;

      logger.debug(
        `Validation successful for ${source}`,
        {
          source,
        },
        { requestId },
      );

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error(
          `Unexpected error during ${source} validation`,
          {
            source,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { requestId: req.headers["x-request-id"] as string },
        );

        next(
          new AppError("Validation error", 500, "VALIDATION_INTERNAL_ERROR"),
        );
      }
    }
  };
};

/**
 * Validation middleware for request headers (Authorization)
 */
export const validateRequestHeader = validateSchema(
  RequestAuthHeaderSchema,
  "headers",
);

/**
 * Validation middleware for user registration
 */
export const validateUserCreation = validateSchema(CreateUserSchema, "body");

/**
 * Validation middleware for user updates
 */
export const validateUserUpdate = validateSchema(UpdateUserSchema, "body");

/**
 * Validation middleware for user query parameters
 */
export const validateUsersQuery = validateSchema(GetUsersQuerySchema, "query");

/**
 * Validation middleware for user ID parameters
 */
export const validateUserParams = validateSchema(GetUserParamsSchema, "params");

/**
 * Comprehensive validation middleware that validates multiple sources at once
 */
export const validateUserRequest = (
  validateBody: boolean = false,
  validateParams: boolean = false,
  validateQuery: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = req.headers["x-request-id"] as string;
      const errors: Record<string, any> = {};

      logger.debug(
        "Comprehensive validation started",
        {
          validateBody,
          validateParams,
          validateQuery,
        },
        { requestId },
      );

      // Validate params if required
      if (validateParams) {
        const paramsResult = GetUserParamsSchema.safeParse(req.params);
        if (!paramsResult.success) {
          errors.params = paramsResult.error.flatten().fieldErrors;
        } else {
          req.params = paramsResult.data;
        }
      }

      // Validate body if required
      if (validateBody) {
        const bodySchema =
          req.method === "POST" ? CreateUserSchema : UpdateUserSchema;
        const bodyResult = bodySchema.safeParse(req.body);
        if (!bodyResult.success) {
          errors.body = bodyResult.error.flatten().fieldErrors;
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validate query if required
      if (validateQuery) {
        const queryResult = GetUsersQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
          errors.query = queryResult.error.flatten().fieldErrors;
        } else {
          req.query = queryResult.data as any;
        }
      }

      // If there are any validation errors, return them
      if (Object.keys(errors).length > 0) {
        logger.warn(
          "Comprehensive validation failed",
          {
            errors,
            method: req.method,
            path: req.path,
          },
          { requestId },
        );

        throw new AppError(
          "Validation failed",
          400,
          "COMPREHENSIVE_VALIDATION_ERROR",
          errors,
        );
      }

      logger.debug(
        "Comprehensive validation successful",
        {
          validateBody,
          validateParams,
          validateQuery,
        },
        { requestId },
      );

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error(
          "Unexpected error during comprehensive validation",
          {
            error: error instanceof Error ? error.message : "Unknown error",
            method: req.method,
            path: req.path,
          },
          { requestId: req.headers["x-request-id"] as string },
        );

        next(
          new AppError(
            "Internal validation error",
            500,
            "VALIDATION_INTERNAL_ERROR",
          ),
        );
      }
    }
  };
};

/**
 * Sanitization middleware to clean input data
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = req.headers["x-request-id"] as string;

  try {
    // Sanitize string fields in body
    if (req.body && typeof req.body === "object") {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === "string") {
          // Basic XSS protection - remove script tags and other dangerous HTML
          req.body[key] = req.body[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
            .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
            .trim();
        }
      });
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === "string") {
          req.query[key] = (req.query[key] as string)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .trim();
        }
      });
    }

    logger.debug(
      "Input sanitization completed",
      {
        hasBody: !!req.body,
        hasQuery: !!req.query,
      },
      { requestId },
    );

    next();
  } catch (error) {
    logger.error(
      "Error during input sanitization",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { requestId },
    );

    next(new AppError("Input sanitization failed", 500, "SANITIZATION_ERROR"));
  }
};
