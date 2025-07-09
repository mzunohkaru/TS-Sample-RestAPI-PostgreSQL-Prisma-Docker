import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Prisma } from "@prisma/client";

// モジュールをモックに置き換え
jest.mock("../utils/db", () => ({
  prismaClient: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    post: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../utils/hash", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { UserService } from "../services/user.service";
import { AppError } from "../utils/error";
import { prismaClient } from "../utils/db";
import { hashPassword, comparePassword } from "../utils/hash";

// モック化された関数に適切な型情報を付与する
const mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>;
const mockHashPassword = hashPassword as jest.MockedFunction<
  typeof hashPassword
>;
const mockComparePassword = comparePassword as jest.MockedFunction<
  typeof comparePassword
>;

describe("UserService", () => {
  let userService: UserService;

  const mockUser = {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    password: "hashedPassword123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockUserWithoutPassword = {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe("ユーザー作成", () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    it("新しいユーザーを正常に作成するべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(null);
      (
        mockHashPassword as jest.MockedFunction<typeof hashPassword>
      ).mockResolvedValue("hashedPassword123");
      (
        mockPrismaClient.user.create as jest.MockedFunction<
          typeof prismaClient.user.create
        >
      ).mockResolvedValue(mockUserWithoutPassword as never);

      const result = await userService.createUser(userData);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
        select: { id: true },
      });
      expect(mockHashPassword).toHaveBeenCalledWith(userData.password);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it("ユーザーが既に存在する場合はAppErrorをスローするべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue({
        id: "existing-user" as never,
        name: "John Doe",
        email: "john@example.com",
        password: "hashedPassword123",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

      await expect(userService.createUser(userData)).rejects.toThrow(AppError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        "User with this email already exists"
      );
    });

    it("Prismaの制約違反(P2002)を処理するべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(null);
      (
        mockHashPassword as jest.MockedFunction<typeof hashPassword>
      ).mockResolvedValue("hashedPassword123");

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "5.0.0" }
      );
      (
        mockPrismaClient.user.create as jest.MockedFunction<
          typeof prismaClient.user.create
        >
      ).mockRejectedValue(prismaError as never);

      await expect(userService.createUser(userData)).rejects.toThrow(AppError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        "User with this email already exists"
      );
    });

    it("予期しないエラーを処理するべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(null);
      (
        mockHashPassword as jest.MockedFunction<typeof hashPassword>
      ).mockResolvedValue("hashedPassword123");
      (
        mockPrismaClient.user.create as jest.MockedFunction<
          typeof prismaClient.user.create
        >
      ).mockRejectedValue(new Error("Database connection failed") as never);

      await expect(userService.createUser(userData)).rejects.toThrow(AppError);
      await expect(userService.createUser(userData)).rejects.toThrow(
        "Failed to create user"
      );
    });
  });

  describe("ページネーションされたユーザー取得", () => {
    const mockUsers = [
      { ...mockUserWithoutPassword, posts: [] },
      {
        ...mockUserWithoutPassword,
        id: "user-2",
        email: "jane@example.com",
        posts: [],
      },
    ];

    it("デフォルトのパラメータでページネーションされたユーザーを返すべき", async () => {
      (
        mockPrismaClient.user.findMany as jest.MockedFunction<
          typeof prismaClient.user.findMany
        >
      ).mockResolvedValue(mockUsers as never);
      (
        mockPrismaClient.user.count as jest.MockedFunction<
          typeof prismaClient.user.count
        >
      ).mockResolvedValue(2 as never);

      const result = await userService.getUsersPaginated(1, 10);

      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          posts: {
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        hasNext: false,
        hasPrev: false,
      });
    });

    it("データベースエラーを処理するべき", async () => {
      (
        mockPrismaClient.user.findMany as jest.MockedFunction<
          typeof prismaClient.user.findMany
        >
      ).mockRejectedValue(new Error("Database error") as never);

      await expect(userService.getUsersPaginated(1, 10)).rejects.toThrow(
        AppError
      );
      await expect(userService.getUsersPaginated(1, 10)).rejects.toThrow(
        "Failed to fetch users"
      );
    });
  });

  describe("IDでユーザー取得", () => {
    const mockUserWithPosts = {
      ...mockUserWithoutPassword,
      posts: [
        {
          id: "post-1",
          title: "Test Post",
          content: "Test content",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ],
    };

    it("ユーザーが見つかった場合は返すべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(mockUserWithPosts as never);

      const result = await userService.getUserById("user-1");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          posts: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUserWithPosts);
    });

    it("ユーザーが見つからない場合はnullを返すべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(null as never);

      const result = await userService.getUserById("non-existent");

      expect(result).toBeNull();
    });

    it("データベースエラーを処理するべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockRejectedValue(new Error("Database error") as never);

      await expect(userService.getUserById("user-1")).rejects.toThrow(AppError);
      await expect(userService.getUserById("user-1")).rejects.toThrow(
        "Failed to fetch user"
      );
    });
  });

  describe("ユーザー更新", () => {
    const updateData = {
      name: "John Updated",
      email: "john.updated@example.com",
    };

    it("ユーザーを正常に更新するべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(mockUser as never);
      (
        mockPrismaClient.user.findFirst as jest.MockedFunction<
          typeof prismaClient.user.findFirst
        >
      ).mockResolvedValue(null);
      (
        mockPrismaClient.user.update as jest.MockedFunction<
          typeof prismaClient.user.update
        >
      ).mockResolvedValue({
        ...mockUserWithoutPassword,
        ...updateData,
      } as never);

      const result = await userService.updateUser("user-1", updateData);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { id: true, email: true },
      });
      expect(result).toEqual({ ...mockUserWithoutPassword, ...updateData });
    });

    it("ユーザーが見つからない場合はAppErrorをスローするべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(null as never);

      await expect(
        userService.updateUser("user-1", updateData)
      ).rejects.toThrow(AppError);
      await expect(
        userService.updateUser("user-1", updateData)
      ).rejects.toThrow("User not found");
    });

    it("メールが既に存在する場合はAppErrorをスローするべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(mockUser as never);
      (
        mockPrismaClient.user.findFirst as jest.MockedFunction<
          typeof prismaClient.user.findFirst
        >
      ).mockResolvedValue({
        id: "other-user" as never,
        name: "Other User",
        email: "other@example.com",
        password: "hashedPassword123",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

      await expect(
        userService.updateUser("user-1", updateData)
      ).rejects.toThrow(AppError);
      await expect(
        userService.updateUser("user-1", updateData)
      ).rejects.toThrow("Email already in use by another user");
    });
  });

  describe("ユーザー削除", () => {
    it("ユーザーを正常に削除するべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(mockUser as never);
      (
        mockPrismaClient.$transaction as jest.MockedFunction<
          typeof prismaClient.$transaction
        >
      ).mockImplementation((callback: any) =>
        callback({
          post: { deleteMany: jest.fn() },
          user: {
            delete: jest
              .fn()
              .mockResolvedValue(mockUserWithoutPassword as never),
          },
        })
      );

      const result = await userService.deleteUser("user-1");

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        select: { id: true, name: true, email: true },
      });
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it("ユーザーが見つからない場合はAppErrorをスローするべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(null as never);

      await expect(userService.deleteUser("user-1")).rejects.toThrow(AppError);
      await expect(userService.deleteUser("user-1")).rejects.toThrow(
        "User not found"
      );
    });
  });

  describe("パスワード検証", () => {
    it("パスワードが有効な場合はユーザーを返すべき", async () => {
      (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as never
      );
      (mockComparePassword as jest.Mock).mockResolvedValue(true as never);

      const result = await userService.validatePassword(
        "john@example.com",
        "password123"
      );

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
      expect(mockComparePassword).toHaveBeenCalledWith(
        "password123",
        "hashedPassword123"
      );
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it("ユーザーが見つからない場合はnullを返すべき", async () => {
      (mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
        null as never
      );

      const result = await userService.validatePassword(
        "john@example.com",
        "password123"
      );

      expect(result).toBeNull();
      expect(mockComparePassword).not.toHaveBeenCalled();
    });

    it("パスワードが無効な場合はnullを返すべき", async () => {
      (
        mockPrismaClient.user.findUnique as jest.MockedFunction<
          typeof prismaClient.user.findUnique
        >
      ).mockResolvedValue(mockUser as never);
      (
        mockComparePassword as jest.MockedFunction<typeof comparePassword>
      ).mockResolvedValue(false as never);

      const result = await userService.validatePassword(
        "john@example.com",
        "wrongpassword"
      );

      expect(mockComparePassword).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedPassword123"
      );
      expect(result).toBeNull();
    });

    it("データベースエラーを処理するべき", async () => {
      (mockPrismaClient.user.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error") as never
      );

      await expect(
        userService.validatePassword("john@example.com", "password123")
      ).rejects.toThrow(AppError);
      await expect(
        userService.validatePassword("john@example.com", "password123")
      ).rejects.toThrow("Authentication failed");
    });
  });
});
