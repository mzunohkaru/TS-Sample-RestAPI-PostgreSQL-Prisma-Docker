import { Request, Response, NextFunction } from "express";
import { prismaClient } from "../../utils/db";
import { logger } from "../../utils/logger";

export class PostReadController {
  /**
   * @desc Get all posts
   * @route GET /api/posts
   * @access Public
   */
  public getPost = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const startTime = Date.now();
      const requestId = req.headers["x-request-id"] as string;

      logger.info(
        "Retrieving all posts",
        {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
        { requestId },
      );

      const posts = await prismaClient.post.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const duration = Date.now() - startTime;

      logger.info(
        "Posts retrieved successfully",
        {
          count: posts.length,
          duration: `${duration}ms`,
        },
        { requestId },
      );

      res.status(200).json({
        success: true,
        message: "Posts retrieved successfully",
        data: posts,
        meta: {
          requestId,
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const duration = Date.now() - (res.locals.startTime || Date.now());
      logger.error(
        "Error retrieving posts",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          duration: `${duration}ms`,
          ip: req.ip,
        },
        { requestId: req.headers["x-request-id"] as string },
      );

      next(error);
    }
  };

  /**
   * @desc Get post summary
   * @route GET /api/posts/summary
   * @access Public
   */
  public getPostSummary = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const startTime = Date.now();
      const requestId = req.headers["x-request-id"] as string;

      logger.info(
        "Retrieving post summary",
        {
          ip: req.ip,
          userAgent: req.headers["user-agent"],
        },
        { requestId },
      );

      const posts = await prismaClient.user_post_summary.findMany();

      const duration = Date.now() - startTime;

      logger.info(
        "Post summary retrieved successfully",
        {
          count: posts.length,
          duration: `${duration}ms`,
        },
        { requestId },
      );

      res.status(200).json({
        success: true,
        message: "Post summary retrieved successfully",
        data: posts,
        meta: {
          requestId,
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const duration = Date.now() - (res.locals.startTime || Date.now());
      logger.error(
        "Error retrieving post summary",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          duration: `${duration}ms`,
          ip: req.ip,
        },
        { requestId: req.headers["x-request-id"] as string },
      );

      next(error);
    }
  };
}
