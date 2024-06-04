import { Request, Response, NextFunction } from "express";

import prisma from "../../../utils/db";
import { hashPassword, comparePassword } from "../../../utils/hash";
import { generateTokens } from "../../middleware/token";

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await hashPassword(password.trim());
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;
    const emailData = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: emailData },
    });

    const isPasswordCorrect = await comparePassword(
      password.trim(),
      user?.password ?? ""
    );
    if (!isPasswordCorrect) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const { token, refreshToken } = generateTokens(emailData);

    // リフレッシュトークンをクライアントに送信
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // JavaScriptからアクセス不可
      secure: process.env.NODE_ENV === "production", // 本番環境ではHTTPSを使用
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function upsertUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  const hashedPassword = await hashPassword(password.trim());
  try {
    const user = await prisma.$transaction(async (prisma) => {
      return await prisma.user.upsert({
        where: { id: Number(id) },
        update: {
          name: name,
          email: email.trim().toLowerCase(),
          password: hashedPassword,
        },
        create: {
          name: name,
          email: email.trim().toLowerCase(),
          password: hashedPassword,
        },
      });
    });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}
