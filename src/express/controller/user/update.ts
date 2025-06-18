import { Request, Response, NextFunction } from "express";

import { prismaClient } from "../../../utils/db";

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;

  const { name, email } = req.body;
  const updateData: { name?: string; email?: string } = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email.trim().toLowerCase();

  try {
    const user = await prismaClient.user.update({
      where: { id: id },
      data: updateData,
    });
    res.status(200).json({
      message: "User updated successfully",
      user: user,
    });
  } catch (error) {
    next(error);
  }
}
