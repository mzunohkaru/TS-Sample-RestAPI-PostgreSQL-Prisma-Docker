import { Request, Response, NextFunction } from "express";

import { prismaClient } from "../../../utils/db";

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const user = await prismaClient.user.delete({
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

