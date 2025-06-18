import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AppError, AuthenticationError } from "../utils/error";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
  tokenRefreshed?: boolean;
  newTokens?: {
    accessToken: string;
    refreshToken: string;
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

/**
 * Enhanced authentication middleware that automatically refreshes tokens
 * if the access token is expired but refresh token is valid
 */
export const authenticateWithAutoRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        "Access token is required",
        401,
        "ACCESS_TOKEN_REQUIRED",
      );
    }

    try {
      // Try to authenticate with access token
      const accessToken = authService.extractTokenFromHeader(authHeader);
      const payload = authService.verifyAccessToken(accessToken);

      (req as AuthenticatedRequest).user = {
        userId: payload.userId,
        email: payload.email,
      };

      logger.debug(
        "User authenticated successfully",
        { userId: payload.userId },
        { requestId },
      );

      next();
    } catch (tokenError) {
      if (
        tokenError instanceof AppError &&
        tokenError.code === "TOKEN_EXPIRED"
      ) {
        // Access token is expired, try to refresh
        const { refreshToken } = req.body;

        if (!refreshToken) {
          throw new AppError(
            "Access token expired and no refresh token provided",
            401,
            "TOKEN_EXPIRED_NO_REFRESH",
          );
        }

        try {
          // Generate new tokens using refresh token
          const newTokens = await authService.refreshToken(refreshToken);

          // Verify the new access token and get user info
          const newPayload = authService.verifyAccessToken(
            newTokens.accessToken,
          );

          (req as AuthenticatedRequest).user = {
            userId: newPayload.userId,
            email: newPayload.email,
          };

          // Mark that tokens were refreshed
          (req as AuthenticatedRequest).tokenRefreshed = true;
          (req as AuthenticatedRequest).newTokens = newTokens;

          logger.info(
            "Token automatically refreshed during authentication",
            { userId: newPayload.userId },
            { requestId },
          );

          next();
        } catch (refreshError) {
          if (
            refreshError instanceof AppError &&
            refreshError.code === "INVALID_REFRESH_TOKEN"
          ) {
            logger.security(
              "Both access and refresh tokens are invalid/expired",
              {
                ip: req.ip,
                userAgent: req.headers["user-agent"],
                path: req.path,
              },
              { requestId },
            );

            throw new AppError(
              "Both access and refresh tokens are expired. Please login again",
              401,
              "TOKENS_EXPIRED",
            );
          }
          throw refreshError;
        }
      } else {
        throw tokenError;
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      logger.security(
        "Authentication with auto-refresh failed",
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

/**
 * Middleware to include refreshed tokens in response if they were refreshed
 */
export const includeRefreshedTokens = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authenticatedReq = req as AuthenticatedRequest;

  if (authenticatedReq.tokenRefreshed && authenticatedReq.newTokens) {
    // Override json method to include new tokens in response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (body && typeof body === "object" && body.success) {
        body.data = body.data || {};
        body.data.tokens = authenticatedReq.newTokens;
        body.meta = body.meta || {};
        body.meta.tokenRefreshed = true;
      }
      return originalJson(body);
    };
  }

  next();
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
