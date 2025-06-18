import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user.service";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { UpdateUserSchema, GetUserParamsSchema } from "../../schema/user";

const userService = new UserService();

/**
 * @desc Update user by ID
 * @route PUT /api/users/:id
 * @access Private (Authentication + Ownership required)
 */
export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;

    logger.info(
      "Updating user",
      {
        userId: req.params.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { requestId },
    );

    // Validate parameters
    const paramsValidation = GetUserParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      logger.warn(
        "Invalid user ID parameter for update",
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
    const bodyValidation = UpdateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      logger.warn(
        "Invalid user update data",
        {
          userId: req.params.id,
          errors: bodyValidation.error.flatten(),
        },
        { requestId },
      );

      throw new AppError(
        "Invalid update data",
        400,
        "INVALID_UPDATE_DATA",
        bodyValidation.error.flatten().fieldErrors,
      );
    }

    const { id } = paramsValidation.data;
    const updateData = bodyValidation.data;

    // Check if there's actually data to update
    if (Object.keys(updateData).length === 0) {
      logger.warn(
        "No fields provided for update",
        { userId: id },
        { requestId },
      );
      throw new AppError("No fields to update", 400, "NO_UPDATE_FIELDS");
    }

    const updatedUser = await userService.updateUser(id, updateData);

    const duration = Date.now() - startTime;

    logger.info(
      "User updated successfully",
      {
        userId: id,
        updatedFields: Object.keys(updateData),
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
      meta: {
        requestId,
        duration,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - (res.locals.startTime || Date.now());
    logger.error(
      "Error updating user",
      {
        userId: req.params.id,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        requestBody: req.body,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
}
