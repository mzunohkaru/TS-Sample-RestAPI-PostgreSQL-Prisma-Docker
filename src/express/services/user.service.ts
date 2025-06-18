import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import { prismaClient } from "../../utils/db";
import { CreateUserSchema, UpdateUserSchema } from "../../schema/user";
import { AppError } from "../../utils/error";

export class UserService {
  async createUser(
    data: typeof CreateUserSchema._type
  ): Promise<Omit<User, "password">> {
    const existingUser = await prismaClient.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError("User already exists", 409, "USER_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prismaClient.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id: string): Promise<Omit<User, "password"> | null> {
    const user = await prismaClient.user.findUnique({
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
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    users: Omit<User, "password">[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prismaClient.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prismaClient.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUser(
    id: string,
    data: typeof UpdateUserSchema._type
  ): Promise<Omit<User, "password">> {
    const existingUser = await prismaClient.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prismaClient.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new AppError("Email already in use", 409, "EMAIL_EXISTS");
      }
    }

    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prismaClient.user.update({
      where: { id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    const existingUser = await prismaClient.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    await prismaClient.user.delete({
      where: { id },
    });
  }

  async validatePassword(
    email: string,
    password: string
  ): Promise<Omit<User, "password"> | null> {
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
