import { Request, Response, NextFunction } from "express";

export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.headers["content-type"] ||
    !req.headers["content-type"].includes("application/json")
  ) {
    res.status(400).json({ message: "Invalid content type" });
    return;
  }
  next();
};

export const validateUserInput = (req: Request): boolean => {
  const { name, email, password } = req.body;
  return (
    name &&
    email &&
    typeof email === "string" &&
    password &&
    typeof password === "string"
  );
};
