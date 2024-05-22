import { Request, Response, NextFunction } from "express";


import prisma from "../../../utils/constants";

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({
      message: "User deleted successfully",
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

