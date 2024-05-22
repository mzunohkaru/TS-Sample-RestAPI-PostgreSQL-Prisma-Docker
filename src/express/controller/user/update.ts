import { Request, Response, NextFunction } from "express";
import prisma from "../../../utils/constants";

import { updateUserSchema } from "../../../schema/user";

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const validationResult = updateUserSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.flatten() });
  }

  const { name, email } = validationResult.data;
  const updateData: { name?: string; email?: string } = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email.trim().toLowerCase();

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    });
    res.status(200).json({
      message: "User updated successfully",
      user: user,
    });
  } catch (error) {
    next(error);
  }
};
