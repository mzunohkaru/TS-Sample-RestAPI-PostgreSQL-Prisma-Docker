import { Request, Response, NextFunction } from "express";
import { RequestAuthHeaderSchema } from "../schema/request-headers";
import {
  CreateUserSchema,
  LoginUserSchema,
  UpdateUserSchema,
} from "../schema/user";

export const vRequestHeader = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = RequestAuthHeaderSchema.safeParse(req.headers);
  if (!result.success) {
    res.status(422).json({ errors: result.error.flatten() });
    return;
  }
  next();
};

export const vRegister = (req: Request, res: Response, next: NextFunction) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({ errors: result.error.flatten() });
    return;
  }
  next();
};

export const vLogin = (req: Request, res: Response, next: NextFunction) => {
  const result = LoginUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({ errors: result.error.flatten() });
    return;
  }
  next();
};

export const vUpdate = (req: Request, res: Response, next: NextFunction) => {
  const validationResult = UpdateUserSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(422).json({ errors: validationResult.error.flatten() });
  }
  return next();
};
