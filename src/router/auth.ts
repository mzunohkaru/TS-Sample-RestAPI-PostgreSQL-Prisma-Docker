import express from "express";
import { AuthController } from "../controller/auth/auth";
import {
  authRateLimit,
  strictRateLimit,
  generalRateLimit,
} from "../middleware/rateLimit";
import {
  vLogin,
  vRequestHeader,
  vRefreshToken,
  vVerifyToken,
} from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = express.Router();

const authController = new AuthController();

// Public auth endpoints with strict rate limiting
router.post("/login", authRateLimit, vLogin, (req, res, next) =>
  authController.login(req, res, next)
);
router.post("/refresh", strictRateLimit, vRefreshToken, (req, res, next) =>
  authController.refreshToken(req, res, next)
);

// Token verification endpoint (handles automatic refresh)
router.post("/verify", authRateLimit, vVerifyToken, (req, res, next) =>
  authController.verifyToken(req, res, next)
);

// Protected auth endpoints with authentication middleware
router.post("/logout", vRequestHeader, authenticate, (req, res, next) =>
  authController.logout(req as any, res, next)
);

router.get(
  "/me",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  (req, res, next) => authController.me(req as any, res, next)
);

export default router;
