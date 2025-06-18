import { Response, NextFunction } from "express";
import { prismaClient } from "../../utils/db";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { CreatePostSchema } from "../../schema/post";
import { AuthenticatedRequest } from "../../middleware/auth";

/**
 * @desc Create a new post
 * @route POST /api/posts
 * @access Private (Authentication required)
 */
export async function createPost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("User not authenticated", 401, "NOT_AUTHENTICATED");
    }

    logger.info(
      "Creating new post",
      {
        userId,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { requestId },
    );

    // Validate request body
    const validationResult = CreatePostSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn(
        "Invalid post creation data",
        {
          errors: validationResult.error.flatten(),
          userId,
          ip: req.ip,
        },
        { requestId },
      );

      throw new AppError(
        "Invalid post data",
        400,
        "INVALID_POST_DATA",
        validationResult.error.flatten().fieldErrors,
      );
    }

    const postData = validationResult.data;

    // Create post in database
    const post = await prismaClient.post.create({
      data: {
        title: postData.title,
        content: postData.content,
        userId: userId,
      },
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
      "Post created successfully",
      {
        postId: post.id,
        userId: post.userId,
        title: post.title,
        duration: `${duration}ms`,
      },
      { requestId },
    );

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
      meta: {
        requestId,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - (res.locals.startTime || Date.now());
    logger.error(
      "Error creating post",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        userId: req.user?.userId,
        ip: req.ip,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    next(error);
  }
}
