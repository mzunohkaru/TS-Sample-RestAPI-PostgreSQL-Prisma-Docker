import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

jest.mock("../services/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    validatePassword: jest.fn(),
    getUserById: jest.fn(),
  })),
}));

jest.mock("../config/env", () => ({
  config: {
    jwt: {
      secret: "test-secret-key-at-least-32-chars-long",
      refreshSecret: "test-refresh-secret-key-at-least-32-chars-long",
      accessTokenExpiry: "15m",
      refreshTokenExpiry: "7d",
    },
  },
}));

jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  JsonWebTokenError: jest.requireActual("jsonwebtoken")
    .JsonWebTokenError as any,
  TokenExpiredError: jest.requireActual("jsonwebtoken")
    .TokenExpiredError as any,
}));

import {
  AuthService,
  TokenPayload,
  AuthTokens,
} from "../services/auth.service";
import { UserService } from "../services/user.service";
import { AppError } from "../utils/error";
import { config } from "../config/env";

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserServiceInstance: jest.Mocked<UserService>;

  const mockUser: Omit<User, "password"> = {
    id: "user-123",
    email: "john@example.com",
    name: "John Doe",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // const mockUserWithPassword: User = {
  //   ...mockUser,
  //   password: "hashedPassword123",
  // };

  const mockTokenPayload: TokenPayload = {
    userId: "user-123",
    email: "john@example.com",
  };

  const mockTokens: AuthTokens = {
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };

  beforeEach(() => {
    mockUserServiceInstance = {
      validatePassword: jest.fn(),
      getUserById: jest.fn(),
    } as any;

    mockUserService.mockImplementation(() => mockUserServiceInstance);
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe("ログイン", () => {
    const validCredentials = {
      email: "john@example.com",
      password: "password123",
    };

    it("有効な資格情報でユーザーを正常に認証する必要があります", async () => {
      mockUserServiceInstance.validatePassword.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce("mock-access-token" as never)
        .mockReturnValueOnce("mock-refresh-token" as never);

      const result = await authService.login(
        validCredentials.email,
        validCredentials.password
      );

      expect(mockUserServiceInstance.validatePassword).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password
      );
      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        config.jwt.secret,
        { expiresIn: config.jwt.accessTokenExpiry }
      );
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshTokenExpiry }
      );
      expect(result).toEqual({
        user: mockUser,
        tokens: mockTokens,
      });
    });

    it("資格情報が無効な場合はAppErrorをスローする必要があります", async () => {
      mockUserServiceInstance.validatePassword.mockResolvedValue(null);

      await expect(
        authService.login(validCredentials.email, validCredentials.password)
      ).rejects.toThrow(AppError);

      await expect(
        authService.login(validCredentials.email, validCredentials.password)
      ).rejects.toThrow("Invalid credentials");

      const error = await authService
        .login(validCredentials.email, validCredentials.password)
        .catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("INVALID_CREDENTIALS");
    });

    it("ユーザーの検証に失敗した場合はAppErrorをスローする必要があります", async () => {
      mockUserServiceInstance.validatePassword.mockResolvedValue(null);

      await expect(
        authService.login("nonexistent@example.com", "wrongpassword")
      ).rejects.toThrow(AppError);

      expect(mockUserServiceInstance.validatePassword).toHaveBeenCalledWith(
        "nonexistent@example.com",
        "wrongpassword"
      );
    });

    it("検証中にデータベースエラーを処理する必要があります", async () => {
      const dbError = new Error("Database connection failed");
      mockUserServiceInstance.validatePassword.mockRejectedValue(dbError);

      await expect(
        authService.login(validCredentials.email, validCredentials.password)
      ).rejects.toThrow(dbError);
    });
  });

  describe("リフレッシュトークン", () => {
    const validRefreshToken = "valid-refresh-token";
    const expiredRefreshToken = "expired-refresh-token";
    const invalidRefreshToken = "invalid-refresh-token";

    it("有効なリフレッシュトークンでトークンを正常にリフレッシュする必要があります", async () => {
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce("new-access-token" as never)
        .mockReturnValueOnce("new-refresh-token" as never);

      const result = await authService.refreshToken(validRefreshToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        validRefreshToken,
        config.jwt.refreshSecret
      );
      expect(mockUserServiceInstance.getUserById).toHaveBeenCalledWith(
        mockTokenPayload.userId
      );
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("リフレッシュトークンが無効な場合はAppErrorをスローする必要があります", async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError("Invalid token");
      });

      await expect(
        authService.refreshToken(invalidRefreshToken)
      ).rejects.toThrow(AppError);

      const error = await authService
        .refreshToken(invalidRefreshToken)
        .catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("INVALID_REFRESH_TOKEN");
      expect(error.message).toBe("Invalid refresh token");
    });

    it("リフレッシュトークンが期限切れの場合はAppErrorをスローする必要があります", async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      await expect(
        authService.refreshToken(expiredRefreshToken)
      ).rejects.toThrow(AppError);

      const error = await authService
        .refreshToken(expiredRefreshToken)
        .catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("ユーザーが見つからない場合はAppErrorをスローする必要があります", async () => {
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockUserServiceInstance.getUserById.mockResolvedValue(null);

      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow(
        AppError
      );

      const error = await authService
        .refreshToken(validRefreshToken)
        .catch((err) => err);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("USER_NOT_FOUND");
      expect(error.message).toBe("User not found");
    });

    it("ユーザー検索中にデータベースエラーを処理する必要があります", async () => {
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      const dbError = new Error("Database connection failed");
      mockUserServiceInstance.getUserById.mockRejectedValue(dbError);

      await expect(authService.refreshToken(validRefreshToken)).rejects.toThrow(
        dbError
      );
    });
  });

  describe("アクセストークンの検証", () => {
    const validAccessToken = "valid-access-token";
    const expiredAccessToken = "expired-access-token";
    const invalidAccessToken = "invalid-access-token";

    it("有効なアクセストークンを正常に検証する必要があります", () => {
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);

      const result = authService.verifyAccessToken(validAccessToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        validAccessToken,
        config.jwt.secret
      );
      expect(result).toEqual(mockTokenPayload);
    });

    it("アクセストークンが期限切れの場合はAppErrorをスローする必要があります", () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError("Token expired", new Date());
      });

      expect(() => authService.verifyAccessToken(expiredAccessToken)).toThrow(
        AppError
      );

      const error = (() => {
        try {
          authService.verifyAccessToken(expiredAccessToken);
        } catch (err) {
          return err;
        }
      })();

      expect(error).toBeInstanceOf(AppError);
      // @ts-expect-error
      expect(error.statusCode).toBe(401);
      // @ts-expect-error
      expect(error.code).toBe("TOKEN_EXPIRED");
      // @ts-expect-error
      expect(error.message).toBe("Token expired");
    });

    it("アクセストークンが無効な場合はAppErrorをスローする必要があります", () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError("Invalid token");
      });

      expect(() => authService.verifyAccessToken(invalidAccessToken)).toThrow(
        AppError
      );

      const error = (() => {
        try {
          authService.verifyAccessToken(invalidAccessToken);
        } catch (err) {
          return err;
        }
      })();

      expect(error).toBeInstanceOf(AppError);
      // @ts-expect-error
      expect(error.statusCode).toBe(401);
      // @ts-expect-error
      expect(error.code).toBe("INVALID_TOKEN");
      // @ts-expect-error
      expect(error.message).toBe("Invalid token");
    });

    it("予期しないエラーを再スローする必要があります", () => {
      const unexpectedError = new Error("Unexpected error");
      mockJwt.verify.mockImplementation(() => {
        throw unexpectedError;
      });

      expect(() => authService.verifyAccessToken(validAccessToken)).toThrow(
        unexpectedError
      );
    });
  });

  describe("ヘッダーからのトークンの抽出", () => {
    it("有効なBearerヘッダーからトークンを正常に抽出する必要があります", () => {
      const validHeader = "Bearer valid-token-123";
      const result = authService.extractTokenFromHeader(validHeader);

      expect(result).toBe("valid-token-123");
    });

    it("認証ヘッダーが欠落している場合はAppErrorをスローする必要があります", () => {
      expect(() => authService.extractTokenFromHeader(undefined)).toThrow(
        AppError
      );

      const error = (() => {
        try {
          authService.extractTokenFromHeader(undefined);
        } catch (err) {
          return err;
        }
      })();

      expect(error).toBeInstanceOf(AppError);
      // @ts-expect-error
      expect(error.statusCode).toBe(401);
      // @ts-expect-error
      expect(error.code).toBe("AUTH_HEADER_MISSING");
      // @ts-expect-error
      expect(error.message).toBe("Authorization header missing");
    });

    it("認証ヘッダーの形式が無効な場合はAppErrorをスローする必要があります", () => {
      const invalidFormats = [
        "invalid-format",
        "Bearer",
        "bearer valid-token",
        "Basic dXNlcjpwYXNz",
        "Bearer token1 token2 token3",
      ];

      invalidFormats.forEach((invalidHeader) => {
        expect(() => authService.extractTokenFromHeader(invalidHeader)).toThrow(
          AppError
        );

        const error = (() => {
          try {
            authService.extractTokenFromHeader(invalidHeader);
          } catch (err) {
            return err;
          }
        })();

        expect(error).toBeInstanceOf(AppError);
        // @ts-expect-error
        expect(error.statusCode).toBe(401);
        // @ts-expect-error
        expect(error.code).toBe("INVALID_AUTH_HEADER");
        // @ts-expect-error
        expect(error.message).toBe("Invalid authorization header format");
      });
    });

    it("空の文字列ヘッダーを処理する必要があります", () => {
      expect(() => authService.extractTokenFromHeader("")).toThrow(AppError);

      const error = (() => {
        try {
          authService.extractTokenFromHeader("");
        } catch (err) {
          return err;
        }
      })();

      expect(error).toBeInstanceOf(AppError);
      // @ts-expect-error
      expect(error.statusCode).toBe(401);
      // @ts-expect-error
      expect(error.code).toBe("AUTH_HEADER_MISSING");
      // @ts-expect-error
      expect(error.message).toBe("Authorization header missing");
    });
  });

  describe("トークンの生成 (統合)", () => {
    it("ログイン中にアクセストークンとリフレッシュトークンの両方を生成する必要があります", async () => {
      mockUserServiceInstance.validatePassword.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce("generated-access-token" as never)
        .mockReturnValueOnce("generated-refresh-token" as never);

      const result = await authService.login("john@example.com", "password123");

      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockJwt.sign).toHaveBeenNthCalledWith(
        1,
        { userId: mockUser.id, email: mockUser.email },
        config.jwt.secret,
        { expiresIn: config.jwt.accessTokenExpiry }
      );
      expect(mockJwt.sign).toHaveBeenNthCalledWith(
        2,
        { userId: mockUser.id, email: mockUser.email },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshTokenExpiry }
      );
      expect(result.tokens).toEqual({
        accessToken: "generated-access-token",
        refreshToken: "generated-refresh-token",
      });
    });

    it("リフレッシュ中に新しいトークンを生成する必要があります", async () => {
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce("new-access-token" as never)
        .mockReturnValueOnce("new-refresh-token" as never);

      const result = await authService.refreshToken("valid-refresh-token");

      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });
  });

  describe("AuthServiceのエラーハンドリング", () => {
    it("ログイン中にJWT署名エラーを処理する必要があります", async () => {
      mockUserServiceInstance.validatePassword.mockResolvedValue(mockUser);
      mockJwt.sign.mockImplementation(() => {
        throw new Error("JWT signing failed");
      });

      await expect(
        authService.login("john@example.com", "password123")
      ).rejects.toThrow("JWT signing failed");
    });

    it("リフレッシュ中にJWT署名エラーを処理する必要があります", async () => {
      mockJwt.verify.mockReturnValue(mockTokenPayload as never);
      mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
      mockJwt.sign.mockImplementation(() => {
        throw new Error("JWT signing failed");
      });

      await expect(
        authService.refreshToken("valid-refresh-token")
      ).rejects.toThrow("JWT signing failed");
    });
  });

  describe("AuthServiceのコンストラクタ", () => {
    it("UserServiceインスタンスを作成する必要があります", () => {
      expect(mockUserService).toHaveBeenCalled();
      expect(authService).toBeInstanceOf(AuthService);
    });
  });
});
