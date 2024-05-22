import { Request, Response, NextFunction } from "express";

import prisma from "../../../utils/constants";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        posts: true,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const user = await prisma.user.findFirst({
    where: { id: Number(id) },
    include: {
      posts: true,
    },
  });
  res.status(200).json(user);
};
