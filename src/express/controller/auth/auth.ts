import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/auth.service";
import { AuthenticatedRequest } from "../../middleware/auth";
import { AppError } from "../../../utils/error";
import { logger } from "../../../utils/logger";

const authService = new AuthService();

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

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    // TODO: Implement token blacklisting for proper logout
    // For now, we'll just log the logout event
    logger.info(
      "User logged out",
      {
        userId: authenticatedReq.user.userId,
      },
      { requestId: req.headers["x-request-id"] as string },
    );

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        user: authenticatedReq.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
