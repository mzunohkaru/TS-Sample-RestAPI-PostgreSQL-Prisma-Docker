import { Request, Response, NextFunction } from "express";

import { prismaClient } from "../../../utils/db";

export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const posts = await prismaClient.post.findMany();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPostSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const posts = await prismaClient.user_post_summary.findMany();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
