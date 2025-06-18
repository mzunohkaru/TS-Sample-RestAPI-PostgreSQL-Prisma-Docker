import express, { RequestHandler } from "express";

import {
  vRequestHeader,
  vCreatePost,
  vUpdatePost,
} from "../middleware/validate";
import { getPost, getPostSummary } from "../controller/post/read";
import { createPost } from "../controller/post/create";
import { updatePost } from "../controller/post/update";
import { deletePost } from "../controller/post/delete";
import { authenticate, optionalAuth } from "../middleware/auth";
import { generalRateLimit } from "../middleware/rateLimit";

const router = express.Router();

// Public endpoints
router.get("/", vRequestHeader, generalRateLimit, optionalAuth, getPost);
router.get(
  "/summary",
  vRequestHeader,
  generalRateLimit,
  optionalAuth,
  getPostSummary,
);

// Protected endpoints
router.post(
  "/",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  vCreatePost,
  createPost as unknown as RequestHandler,
);
router.put(
  "/:id",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  vUpdatePost,
  updatePost as unknown as RequestHandler,
);
router.delete(
  "/:id",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  deletePost as unknown as RequestHandler,
);

export default router;
