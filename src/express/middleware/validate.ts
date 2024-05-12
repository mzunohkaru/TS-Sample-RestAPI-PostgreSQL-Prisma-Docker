import { Request, Response, NextFunction } from "express";
import { header, body, validationResult } from "express-validator";

export const vContentType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  header("content-type").equals("application/json").withMessage("Invalid content type");
  next();
};

export const vRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  body("name").isEmpty().withMessage("Name is required").isString();
  body("email").isEmail().withMessage("Email is required").isString();
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .isString();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

export const vLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  body("email").isEmail().withMessage("Email is required").isString();
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters").isString();
  next();
}

export const vUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  body("name").isString();
  body("email").isEmail().withMessage("Email is required").isString();
  if (!req.body.name && !req.body.email) {
    res.status(4000).json({ error: "Name or email is required" });
    return;
  }
  next();
}