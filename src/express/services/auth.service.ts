import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { UserService } from "./user.service";
import { AppError } from "../../utils/error";
import { config } from "../../config/env";

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    user: Omit<User, "password">;
    tokens: AuthTokens;
  }> {
    const user = await this.userService.validatePassword(email, password);

    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const tokens = this.generateTokens(user);

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret,
      ) as TokenPayload;

      const user = await this.userService.getUserById(decoded.userId);

      if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(
          "Invalid refresh token",
          401,
          "INVALID_REFRESH_TOKEN",
        );
      }
      throw error;
    }
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Token expired", 401, "TOKEN_EXPIRED");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid token", 401, "INVALID_TOKEN");
      }
      throw error;
    }
  }

  private generateTokens(user: Omit<User, "password">): AuthTokens {
    const payload: Omit<TokenPayload, "iat" | "exp"> = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new AppError(
        "Authorization header missing",
        401,
        "AUTH_HEADER_MISSING",
      );
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new AppError(
        "Invalid authorization header format",
        401,
        "INVALID_AUTH_HEADER",
      );
    }

    return parts[1];
  }
}
