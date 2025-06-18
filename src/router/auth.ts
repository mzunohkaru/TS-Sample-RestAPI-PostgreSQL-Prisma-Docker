import express from "express";
import {
  login,
  refreshToken,
  logout,
  me,
  verifyToken,
} from "../controller/auth/auth";
import { authRateLimit, strictRateLimit } from "../middleware/rateLimit";
import { vLogin } from "../middleware/validate";

const router = express.Router();

// Public auth endpoints with strict rate limiting
router.post("/login", authRateLimit, vLogin, login);
router.post("/refresh", strictRateLimit, refreshToken);

// Token verification endpoint (handles automatic refresh)
router.post("/verify", authRateLimit, verifyToken);

// Protected auth endpoints with auto-refresh capability
router.post("/logout", logout);
router.get("/me", me);

export default router;
