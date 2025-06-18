import { Response, NextFunction } from "express";
import { prismaClient } from "../../utils/db";
import { AppError, NotFoundError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { UpdatePostSchema, GetPostParamsSchema } from "../../schema/post";
import { AuthenticatedRequest } from "../../middleware/auth";

/**
 * @desc Update post by ID
 * @route PUT /api/posts/:id
 * @access Private (Authentication + Ownership required)
 */
export async function updatePost(
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
      "Updating post",
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
        "Invalid post ID parameter for update",
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

    // Validate request body
    const bodyValidation = UpdatePostSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      logger.warn(
        "Invalid post update data",
        {
          postId: req.params.id,
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
        { postId: id },
        { requestId },
      );
      throw new AppError("No fields to update", 400, "NO_UPDATE_FIELDS");
    }

    // Check if post exists and user owns it
    const existingPost = await prismaClient.post.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
      },
    });

    if (!existingPost) {
      logger.warn(
        "Post not found for update",
        { postId: id, userId },
        { requestId },
      );
      throw new NotFoundError("Post not found");
    }

    // Check ownership
    if (existingPost.userId !== userId) {
      logger.warn(
        "User attempted to update post they don't own",
        { postId: id, userId, ownerId: existingPost.userId },
        { requestId },
      );
      throw new AppError(
        "You can only update your own posts",
        403,
        "INSUFFICIENT_PERMISSIONS",
      );
    }

    // Update post
    const updatedPost = await prismaClient.post.update({
      where: { id },
      data: updateData,
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

    const duration = Date.now() - startTime;

    logger.info(
      "Post updated successfully",
      {
        postId: id,
        userId,
        updatedFields: Object.keys(updateData),
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
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
      "Error updating post",
      {
        postId: req.params.id,
        userId: req.user?.userId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        requestBody: req.body,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
}