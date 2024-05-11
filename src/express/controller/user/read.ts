import { Request, Response, NextFunction } from "express";

import prisma from "../../utils/constants";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      posts: true,
    },
  });
  res.status(200).json(user);
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
