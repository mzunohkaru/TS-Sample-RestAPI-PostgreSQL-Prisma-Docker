import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth.service";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { AuthenticatedRequest } from "../../middleware/auth";

const authService = new AuthService();

/**
 * @desc Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    logger.info(
      "User logged in successfully",
      {
        userId: result.user.id,
        email: result.user.email,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Refresh access token
 * @route POST /api/auth/refresh
 * @access Public
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    logger.info(
      "Token refreshed successfully",
      {},
      { requestId: req.headers["x-request-id"] as string },
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Verify and refresh token if needed
 * @route POST /api/auth/verify
 * @access Private (requires access token)
 */
export const verifyToken = async (
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

    let accessToken: string;
    let newTokens: { accessToken: string; refreshToken: string } | null = null;

    try {
      accessToken = authService.extractTokenFromHeader(authHeader);
      const payload = authService.verifyAccessToken(accessToken);

      logger.info(
        "Access token verified successfully",
        { userId: payload.userId },
        { requestId },
      );

      res.status(200).json({
        success: true,
        message: "Token is valid",
        data: {
          user: {
            userId: payload.userId,
            email: payload.email,
          },
          tokenStatus: "valid",
        },
      });
    } catch (tokenError) {
      if (
        tokenError instanceof AppError &&
        tokenError.code === "TOKEN_EXPIRED"
      ) {
        // アクセストークンが期限切れの場合、リフレッシュトークンをチェック
        const { refreshToken } = req.body;

        if (!refreshToken) {
          throw new AppError(
            "Access token expired and no refresh token provided",
            401,
            "TOKEN_EXPIRED_NO_REFRESH",
          );
        }

        try {
          // リフレッシュトークンで新しいトークンを生成
          newTokens = await authService.refreshToken(refreshToken);

          // 新しいアクセストークンを検証してユーザー情報を取得
          const newPayload = authService.verifyAccessToken(
            newTokens.accessToken,
          );

          logger.info(
            "Token automatically refreshed due to expiration",
            { userId: newPayload.userId },
            { requestId },
          );

          res.status(200).json({
            success: true,
            message: "Token refreshed automatically",
            data: {
              user: {
                userId: newPayload.userId,
                email: newPayload.email,
              },
              tokens: newTokens,
              tokenStatus: "refreshed",
            },
          });
        } catch (refreshError) {
          if (
            refreshError instanceof AppError &&
            refreshError.code === "INVALID_REFRESH_TOKEN"
          ) {
            logger.warn(
              "Both access and refresh tokens are invalid/expired",
              {},
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
    next(error);
  }
};

/**
 * @desc Logout user
 * @route POST /api/auth/logout
 * @access Private (requires access token)
 */
export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { userId } = req.user;

    // TODO: Implement token blacklisting for proper logout
    logger.info("User logged out", { userId }, { requestId });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get current user profile
 * @route GET /api/auth/me
 * @access Private (requires access token)
 */
export const me = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestId = req.headers["x-request-id"] as string;

    // authenticateミドルウェアで既に認証済み
    const user = req.user;
    const tokenStatus = "valid";

    // 基本認証が成功した場合はそのまま使用
    logger.info(
      "User profile retrieved successfully",
      { userId: user.userId },
      { requestId },
    );

    const responseData: {
      user: { userId: string; email: string };
      tokenStatus: string;
    } = {
      user,
      tokenStatus,
    };

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};
