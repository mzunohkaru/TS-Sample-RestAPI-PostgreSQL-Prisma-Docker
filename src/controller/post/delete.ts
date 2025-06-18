import { Response, NextFunction } from "express";
import { prismaClient } from "../../utils/db";
import { AppError, NotFoundError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { GetPostParamsSchema } from "../../schema/post";
import { AuthenticatedRequest } from "../../middleware/auth";

/**
 * @desc Delete post by ID
 * @route DELETE /api/posts/:id
 * @access Private (Authentication + Ownership required)
 */
export async function deletePost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("User not authenticated", 401, "NOT_AUTHENTICATED");
    }

    logger.info(
      "Deleting post",
      {
        postId: req.params.id,
        userId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { requestId },
    );

    // Validate parameters
    const paramsValidation = GetPostParamsSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      logger.warn(
        "Invalid post ID parameter for deletion",
        {
          postId: req.params.id,
          errors: paramsValidation.error.flatten(),
        },
        { requestId },
      );

      throw new AppError(
        "Invalid post ID format",
        400,
        "INVALID_POST_ID",
        paramsValidation.error.flatten().fieldErrors,
      );
    }

    const { id } = paramsValidation.data;

    // Check if post exists and user owns it
    const existingPost = await prismaClient.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingPost) {
      logger.warn(
        "Attempt to delete non-existent post",
        { postId: id, userId },
        { requestId },
      );
      throw new NotFoundError("Post not found");
    }

    // Check ownership
    if (existingPost.userId !== userId) {
      logger.warn(
        "User attempted to delete post they don't own",
        { postId: id, userId, ownerId: existingPost.userId },
        { requestId },
      );
      throw new AppError(
        "You can only delete your own posts",
        403,
        "INSUFFICIENT_PERMISSIONS",
      );
    }

    // Log post info before deletion for audit trail
    logger.info(
      "Post found for deletion",
      {
        postId: id,
        userId: existingPost.userId,
        title: existingPost.title,
        createdAt: existingPost.createdAt,
      },
      { requestId },
    );

    // Delete post
    const deletedPost = await prismaClient.post.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
      },
    });

    const duration = Date.now() - startTime;

    logger.info(
      "Post deleted successfully",
      {
        postId: id,
        userId,
        title: deletedPost.title,
        duration: `${duration}ms`,
      },
      { requestId },
    );

    // Return minimal information about deleted post for security
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: {
        id: deletedPost.id,
        title: deletedPost.title,
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
      "Error deleting post",
      {
        postId: req.params.id,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
}