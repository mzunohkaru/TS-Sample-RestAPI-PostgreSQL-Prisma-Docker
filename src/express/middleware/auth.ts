import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AppError, AuthenticationError } from "../../utils/error";
import { logger } from "../../utils/logger";

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

const authService = new AuthService();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = authService.extractTokenFromHeader(req.headers.authorization);
    const payload = authService.verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
    };

    logger.debug(
      "User authenticated successfully",
      { userId: payload.userId },
      { requestId: req.headers["x-request-id"] as string },
    );
    next();
  } catch (error) {
    if (error instanceof AppError) {
      logger.security(
        "Authentication failed",
        {
          error: error.message,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          path: req.path,
        },
        { requestId: req.headers["x-request-id"] as string },
      );
      next(error);
    } else {
      logger.error("Unexpected authentication error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      next(new AuthenticationError("Authentication failed"));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;

      if (!authenticatedReq.user) {
        throw new AuthenticationError("User not authenticated");
      }

      // TODO: Implement role-based authorization when user roles are added to the schema
      // For now, all authenticated users are authorized
      logger.debug("User authorized successfully", {
        userId: authenticatedReq.user.userId,
        roles,
      });
      next();
    } catch (error) {
      logger.security("Authorization failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: (req as AuthenticatedRequest).user?.userId,
        roles,
      });
      next(error);
    }
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authService.extractTokenFromHeader(authHeader);
    const payload = authService.verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
    };

    logger.debug("Optional authentication successful", {
      userId: payload.userId,
    });
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens, just proceed without user context
    logger.warn(
      "Optional authentication failed, proceeding without user context",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    );
    next();
  }
};

export const requireOwnership = (resourceIdParam: string = "id") => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const resourceId = req.params[resourceIdParam];

      if (!authenticatedReq.user) {
        throw new AuthenticationError("User not authenticated");
      }

      // For user resources, check if the authenticated user owns the resource
      if (resourceId !== authenticatedReq.user.userId) {
        logger.security("Ownership authorization failed", {
          userId: authenticatedReq.user.userId,
          resourceId,
          path: req.path,
        });
        throw new AppError(
          "Access denied: You can only access your own resources",
          403,
          "OWNERSHIP_REQUIRED",
        );
      }

      logger.debug("Ownership authorization successful", {
        userId: authenticatedReq.user.userId,
        resourceId,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
