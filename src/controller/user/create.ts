import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user.service";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { CreateUserSchema, GetUserParamsSchema } from "../../schema/user";

const userService = new UserService();

/**
 * @desc Create a new user (Registration)
 * @route POST /api/users/register
 * @access Public
 */
export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;

    logger.info(
      "Creating new user",
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { requestId },
    );

    // Validate request body
    const validationResult = CreateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn(
        "Invalid user creation data",
        {
          errors: validationResult.error.flatten(),
          ip: req.ip,
        },
        { requestId },
      );

      throw new AppError(
        "Invalid user data",
        400,
        "INVALID_USER_DATA",
        validationResult.error.flatten().fieldErrors,
      );
    }

    const userData = validationResult.data;
    const user = await userService.createUser(userData);

    const duration = Date.now() - startTime;

    logger.info(
      "User created successfully",
      {
        userId: user.id,
        email: user.email,
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
      meta: {
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - (res.locals.startTime || Date.now());
    logger.error(
      "Error creating user",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        ip: req.ip,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
}

/**
 * @desc Create or update user (Upsert operation)
 * @route POST /api/users/:id
 * @access Private (Authentication + Ownership required)
 */
export async function upsertUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;

    logger.info(
      "Upserting user",
      {
        userId: req.params.id,
        ip: req.ip,
      },
      { requestId },
    );

    // Validate parameters
    const paramsValidation = GetUserParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      logger.warn(
        "Invalid user ID parameter for upsert",
        {
          userId: req.params.id,
          errors: paramsValidation.error.flatten(),
        },
        { requestId },
      );

      throw new AppError(
        "Invalid user ID format",
        400,
        "INVALID_USER_ID",
        paramsValidation.error.flatten().fieldErrors,
      );
    }

    // Validate request body
    const bodyValidation = CreateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      logger.warn(
        "Invalid user upsert data",
        {
          userId: req.params.id,
          errors: bodyValidation.error.flatten(),
        },
        { requestId },
      );

      throw new AppError(
        "Invalid user data",
        400,
        "INVALID_USER_DATA",
        bodyValidation.error.flatten().fieldErrors,
      );
    }

    const { id } = paramsValidation.data;
    const userData = bodyValidation.data;

    // Check if user exists to determine if it's create or update
    const existingUser = await userService.getUserById(id);
    let user;
    let isCreated = false;

    if (existingUser) {
      // Update existing user
      user = await userService.updateUser(id, userData);
      logger.info("User updated via upsert", { userId: id }, { requestId });
    } else {
      // Create new user with specific ID (if your system allows it)
      user = await userService.createUser(userData);
      isCreated = true;
      logger.info(
        "User created via upsert",
        { userId: user.id },
        { requestId },
      );
    }

    const duration = Date.now() - startTime;

    logger.info(
      "User upsert completed successfully",
      {
        userId: user.id,
        operation: isCreated ? "created" : "updated",
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(isCreated ? 201 : 200).json({
      success: true,
      message: `User ${isCreated ? "created" : "updated"} successfully`,
      data: user,
      meta: {
        requestId,
        duration,
        operation: isCreated ? "created" : "updated",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - (res.locals.startTime || Date.now());
    logger.error(
      "Error upserting user",
      {
        userId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
}
