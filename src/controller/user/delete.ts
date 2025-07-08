import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/user.service";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { GetUserParamsSchema } from "../../schema/user";

export class UserDeleteController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * @desc Delete user by ID
   * @route DELETE /api/users/:id
   * @access Private (Authentication + Ownership required)
   */
  public deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const startTime = Date.now();
      const requestId = req.headers["x-request-id"] as string;

      logger.info(
        "Deleting user",
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
          "Invalid user ID parameter for deletion",
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

      // Additional security check: ensure user exists before deletion
      const existingUser = await this.userService.getUserById(id);
      if (!existingUser) {
        logger.warn(
          "Attempt to delete non-existent user",
          { userId: id },
          { requestId },
        );
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }

      // Log user info before deletion for audit trail
      logger.info(
        "User found for deletion",
        {
          userId: id,
          email: existingUser.email,
          name: existingUser.name,
        },
        { requestId },
      );

      const deletedUser = await this.userService.deleteUser(id);

      const duration = Date.now() - startTime;

      logger.info(
        "User deleted successfully",
        {
          userId: id,
          email: deletedUser.email,
          duration: `${duration}ms`,
        },
        { requestId },
      );

      // Return minimal information about deleted user for security
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: {
          id: deletedUser.id,
          email: deletedUser.email,
          deletedAt: new Date().toISOString(),
        },
        meta: {
          requestId,
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const duration = Date.now() - (res.locals.startTime || Date.now());
      logger.error(
        "Error deleting user",
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
}
