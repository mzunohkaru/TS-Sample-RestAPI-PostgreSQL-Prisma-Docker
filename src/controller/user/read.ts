import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user.service";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { GetUsersQuerySchema, GetUserParamsSchema } from "../../schema/user";

const userService = new UserService();

/**
 * @desc Get all users with pagination, search, and sorting
 * @route GET /api/users
 * @access Public (consider adding authentication for production)
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;

    logger.info(
      "Getting users list",
      {
        query: req.query,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { requestId },
    );

    // Validate and parse query parameters
    const validationResult = GetUsersQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      logger.warn(
        "Invalid query parameters for get users",
        {
          errors: validationResult.error.flatten(),
          query: req.query,
        },
        { requestId },
      );

      throw new AppError(
        "Invalid query parameters",
        400,
        "INVALID_QUERY_PARAMETERS",
        validationResult.error.flatten().fieldErrors,
      );
    }

    const { page, limit, search, sortBy, sortOrder } = validationResult.data;

    const result = await userService.getUsersPaginated(page, limit, {
      search,
      sortBy,
      sortOrder,
    });

    const duration = Date.now() - startTime;

    logger.info(
      "Users list retrieved successfully",
      {
        count: result.users.length,
        totalCount: result.pagination.totalCount,
        page,
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
      meta: {
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - (res.locals.startTime || Date.now());
    logger.error(
      "Error retrieving users list",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        query: req.query,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
};

/**
 * @desc Get user by ID
 * @route GET /api/users/:id
 * @access Private (Authentication required)
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;

    logger.info(
      "Getting user by ID",
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
        "Invalid user ID parameter",
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

    const { id } = paramsValidation.data;

    const user = await userService.getUserById(id);

    if (!user) {
      logger.warn("User not found", { userId: id }, { requestId });
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const duration = Date.now() - startTime;

    logger.info(
      "User retrieved successfully",
      {
        userId: id,
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(200).json({
      success: true,
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
      "Error retrieving user",
      {
        userId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
};
