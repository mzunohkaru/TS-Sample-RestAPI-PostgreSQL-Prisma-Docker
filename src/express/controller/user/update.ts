import { Request, Response, NextFunction } from "express";


import prisma from "../../utils/constants";

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { name: name },
    });
    res.status(200).json({
        message: "User updated successfully",
        user: user,
    });
  } catch (error) {
    next(error);
  }
};

