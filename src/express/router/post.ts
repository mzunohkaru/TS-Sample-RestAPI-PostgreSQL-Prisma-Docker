import express from "express";

import { vRequestHeader } from "../middleware/validate";
import { getPost, getPostSummary } from "../controller/post/read";
import { optionalAuth } from "../middleware/auth";
import { generalRateLimit } from "../middleware/rateLimit";

const router = express.Router();

router.get("/", vRequestHeader, generalRateLimit, optionalAuth, getPost);
router.get(
  "/summary",
  vRequestHeader,
  generalRateLimit,
  optionalAuth,
  getPostSummary,
);

export default router;
