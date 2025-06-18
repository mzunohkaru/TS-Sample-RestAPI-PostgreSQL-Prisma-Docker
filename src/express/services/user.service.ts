import { User, Prisma } from "@prisma/client";
import { prismaClient } from "../../utils/db";
import { hashPassword, comparePassword } from "../../utils/hash";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { CreateUserSchema, UpdateUserSchema } from "../../schema/user";

export interface PaginatedUsers {
  users: Omit<User, "password">[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserFilters {
  search?: string;
  sortBy?: "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export class UserService {
  async createUser(
    userData: CreateUserSchema,
  ): Promise<Omit<User, "password">> {
    try {
      logger.info("Creating new user", { email: userData.email });

      // Check if user already exists
      const existingUser = await prismaClient.user.findUnique({
        where: { email: userData.email },
        select: { id: true },
      });

      if (existingUser) {
        logger.warn("Attempt to create user with existing email", {
          email: userData.email,
        });
        throw new AppError(
          "User with this email already exists",
          409,
          "USER_ALREADY_EXISTS",
        );
      }

      const hashedPassword = await hashPassword(userData.password);

      const user = await prismaClient.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info("User created successfully", {
        userId: user.id,
        email: user.email,
      });
      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          logger.warn("Database constraint violation during user creation", {
            email: userData.email,
            error: error.message,
          });
          throw new AppError(
            "User with this email already exists",
            409,
            "USER_ALREADY_EXISTS",
          );
        }
      }

      logger.error("Unexpected error during user creation", {
        email: userData.email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Failed to create user", 500, "USER_CREATION_FAILED");
    }
  }

  async getUsersPaginated(
    page: number,
    limit: number,
    filters: UserFilters = {},
  ): Promise<PaginatedUsers> {
    try {
      logger.debug("Fetching paginated users", { page, limit, filters });

      const offset = (page - 1) * limit;
      const { search, sortBy = "createdAt", sortOrder = "desc" } = filters;

      // Build where clause for search
      const whereClause: Prisma.UserWhereInput = {};
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      // Build order by clause
      const orderBy: Prisma.UserOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [users, totalCount] = await Promise.all([
        prismaClient.user.findMany({
          where: whereClause,
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
          orderBy,
          skip: offset,
          take: limit,
        }),
        prismaClient.user.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const pagination = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      logger.debug("Users fetched successfully", {
        count: users.length,
        totalCount,
        page,
        totalPages,
      });

      return { users, pagination };
    } catch (error) {
      logger.error("Error fetching paginated users", {
        page,
        limit,
        filters,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Failed to fetch users", 500, "USER_FETCH_FAILED");
    }
  }

  async getUserById(id: string): Promise<Omit<User, "password"> | null> {
    try {
      logger.debug("Fetching user by ID", { userId: id });

      const user = await prismaClient.user.findUnique({
        where: { id },
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

      if (user) {
        logger.debug("User found", { userId: id });
      } else {
        logger.debug("User not found", { userId: id });
      }

      return user;
    } catch (error) {
      logger.error("Error fetching user by ID", {
        userId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Failed to fetch user", 500, "USER_FETCH_FAILED");
    }
  }

  async updateUser(
    id: string,
    updateData: UpdateUserSchema,
  ): Promise<Omit<User, "password">> {
    try {
      logger.info("Updating user", {
        userId: id,
        fields: Object.keys(updateData),
      });

      // Check if user exists
      const existingUser = await prismaClient.user.findUnique({
        where: { id },
        select: { id: true, email: true },
      });

      if (!existingUser) {
        logger.warn("Attempt to update non-existent user", { userId: id });
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }

      // If email is being updated, check for conflicts
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prismaClient.user.findFirst({
          where: {
            email: updateData.email,
            NOT: { id },
          },
          select: { id: true },
        });

        if (emailExists) {
          logger.warn("Attempt to update user with existing email", {
            userId: id,
            email: updateData.email,
          });
          throw new AppError(
            "Email already in use by another user",
            409,
            "EMAIL_ALREADY_EXISTS",
          );
        }
      }

      const updatePayload: Prisma.UserUpdateInput = {};

      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.email) updatePayload.email = updateData.email;
      if (updateData.password) {
        updatePayload.password = await hashPassword(updateData.password);
      }

      const updatedUser = await prismaClient.user.update({
        where: { id },
        data: updatePayload,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info("User updated successfully", {
        userId: id,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          logger.warn("Database constraint violation during user update", {
            userId: id,
            error: error.message,
          });
          throw new AppError(
            "Email already in use by another user",
            409,
            "EMAIL_ALREADY_EXISTS",
          );
        }
        if (error.code === "P2025") {
          logger.warn("User not found during update", { userId: id });
          throw new AppError("User not found", 404, "USER_NOT_FOUND");
        }
      }

      logger.error("Unexpected error during user update", {
        userId: id,
        updateData,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Failed to update user", 500, "USER_UPDATE_FAILED");
    }
  }

  async deleteUser(id: string): Promise<Omit<User, "password">> {
    try {
      logger.info("Deleting user", { userId: id });

      // Check if user exists first
      const existingUser = await prismaClient.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true },
      });

      if (!existingUser) {
        logger.warn("Attempt to delete non-existent user", { userId: id });
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
      }

      // Use transaction to ensure data consistency
      const deletedUser = await prismaClient.$transaction(async (prisma) => {
        // Delete related posts first (cascade delete)
        await prisma.post.deleteMany({
          where: { userId: id },
        });

        // Delete the user
        const user = await prisma.user.delete({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return user;
      });

      logger.info("User deleted successfully", {
        userId: id,
        email: deletedUser.email,
      });

      return deletedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          logger.warn("User not found during deletion", { userId: id });
          throw new AppError("User not found", 404, "USER_NOT_FOUND");
        }
      }

      logger.error("Unexpected error during user deletion", {
        userId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Failed to delete user", 500, "USER_DELETION_FAILED");
    }
  }

  async validatePassword(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    try {
      logger.debug("Validating user password", { email });

      const user = await prismaClient.user.findUnique({
        where: { email },
      });

      if (!user) {
        logger.debug("User not found during password validation", { email });
        return null;
      }

      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        logger.warn("Invalid password attempt", { email });
        return null;
      }

      logger.debug("Password validation successful", { userId: user.id });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error("Error during password validation", {
        email,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError(
        "Authentication failed",
        500,
        "AUTH_VALIDATION_FAILED",
      );
    }
  }
}
