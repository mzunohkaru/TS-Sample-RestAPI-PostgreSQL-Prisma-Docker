import express from "express";
import { RequestHandler } from "express";
import {
  login,
  refreshToken,
  logout,
  me,
  verifyToken,
} from "../controller/auth/auth";
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

// Public auth endpoints with strict rate limiting
router.post("/login", authRateLimit, vLogin, login);
router.post("/refresh", strictRateLimit, vRefreshToken, refreshToken);

// Token verification endpoint (handles automatic refresh)
router.post("/verify", authRateLimit, vVerifyToken, verifyToken);

// Protected auth endpoints with authentication middleware
router.post(
  "/logout",
  vRequestHeader,
  authenticate,
  logout as unknown as RequestHandler,
);

router.get(
  "/me",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  me as unknown as RequestHandler,
);

export default router;
