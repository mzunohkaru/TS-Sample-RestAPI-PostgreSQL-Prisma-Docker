import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth.service";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";

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

    if (!email || !password) {
      throw new AppError(
        "Email and password are required",
        400,
        "MISSING_CREDENTIALS",
      );
    }

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

    if (!refreshToken) {
      throw new AppError(
        "Refresh token is required",
        400,
        "MISSING_REFRESH_TOKEN",
      );
    }

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
    let newTokens: any = null;

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
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(
        "Access token is required for logout",
        401,
        "ACCESS_TOKEN_REQUIRED",
      );
    }

    let userId: string;

    try {
      const accessToken = authService.extractTokenFromHeader(authHeader);
      const payload = authService.verifyAccessToken(accessToken);
      userId = payload.userId;
    } catch (tokenError) {
      if (
        tokenError instanceof AppError &&
        tokenError.code === "TOKEN_EXPIRED"
      ) {
        // ログアウト時はトークンが期限切れでも処理を続行
        logger.warn("Logout attempted with expired token", {}, { requestId });

        res.status(200).json({
          success: true,
          message: "Logout successful (token was already expired)",
        });
        return;
      }
      throw tokenError;
    }

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

    let user: any;
    let tokenStatus = "valid";
    let newTokens: any = null;

    try {
      const accessToken = authService.extractTokenFromHeader(authHeader);
      const payload = authService.verifyAccessToken(accessToken);

      user = {
        userId: payload.userId,
        email: payload.email,
      };

      logger.info(
        "User profile retrieved successfully",
        { userId: payload.userId },
        { requestId },
      );
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

          user = {
            userId: newPayload.userId,
            email: newPayload.email,
          };

          tokenStatus = "refreshed";

          logger.info(
            "Profile retrieved with token refresh",
            { userId: newPayload.userId },
            { requestId },
          );
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

    const responseData: any = {
      user,
      tokenStatus,
    };

    if (newTokens) {
      responseData.tokens = newTokens;
    }

    res.status(200).json({
      success: true,
      message: `User profile retrieved successfully${tokenStatus === "refreshed" ? " with token refresh" : ""}`,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};
