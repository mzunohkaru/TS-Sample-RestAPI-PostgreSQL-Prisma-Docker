import { Request, Response, NextFunction } from "express";
import { RequestAuthHeaderSchema } from "../schema/request-headers";
import {
  CreateUserSchema,
  LoginUserSchema,
  UpdateUserSchema,
  RefreshTokenSchema,
  VerifyTokenSchema,
} from "../schema/user";
import { CreatePostSchema, UpdatePostSchema } from "../schema/post";

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

export const vRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = RefreshTokenSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({ errors: result.error.flatten() });
    return;
  }
  next();
};

export const vVerifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = VerifyTokenSchema.safeParse(req.body);
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

export const vCreatePost = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = CreatePostSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({ errors: result.error.flatten() });
    return;
  }
  next();
};

export const vUpdatePost = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = UpdatePostSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({ errors: result.error.flatten() });
    return;
  }
  next();
};
