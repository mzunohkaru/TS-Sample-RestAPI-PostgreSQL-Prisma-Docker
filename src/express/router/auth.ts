import express from "express";
import { login, refreshToken, logout, me } from "../controller/auth/auth";
import { authenticate } from "../middleware/auth";
import { authRateLimit, strictRateLimit } from "../middleware/rateLimit";
import { vLogin } from "../middleware/validate";

const router = express.Router();

// Public auth endpoints with strict rate limiting
router.post("/login", authRateLimit, vLogin, login);
router.post("/refresh", strictRateLimit, refreshToken);

// Protected auth endpoints
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
