import { Request, Response, NextFunction } from "express";
import { header } from "express-validator";
import { CreateUserSchema, LoginUserSchema, UpdateUserSchema } from "../../schema/user";

export const vContentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  header("content-type")
    .equals("application/json")
    .withMessage("Invalid content type");
  next();
};

export const vRegister = (req: Request, res: Response, next: NextFunction) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten() });
    return;
  }
  next();
};


export const vLogin = (req: Request, res: Response, next: NextFunction) => {
  const result = LoginUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten() });
    return;
  }
  next();
};

export const vUpdate = (req: Request, res: Response, next: NextFunction) => {
  const validationResult = UpdateUserSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({ errors: validationResult.error.flatten() });
  }
  next();
};
