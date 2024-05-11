import { Request, Response, NextFunction } from "express";

import prisma from "../../utils/constants";
import { hashPassword, comparePassword } from "../../middleware/hash";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,
    },
  });
  res.status(200).json(user);
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  const user = await prisma.user.findFirst({
    where: { email: email },
  });

  const isPasswordCorrect = await comparePassword(
    password,
    user?.password ?? ""
  );
  if (!isPasswordCorrect) {
    res.status(400).json({ message: "Invalid email or password" });
    return;
  }

  res.status(200).json({ message: "Login successful" });
};

export const upsertUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  const hashedPassword = await hashPassword(password);
  try {
    const user = await prisma.$transaction(async (prisma) => {
      return await prisma.user.upsert({
        where: { id: Number(id) },
        update: { name: name, email: email, password: hashedPassword },
        create: { name: name, email: email, password: hashedPassword },
      });
    });

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
