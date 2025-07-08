import express from "express";

import {
  vRequestHeader,
  vCreatePost,
  vUpdatePost,
} from "../middleware/validate";
import { PostReadController } from "../controller/post/read";
import { PostController } from "../controller/post/create";
import { PostUpdateController } from "../controller/post/update";
import { PostDeleteController } from "../controller/post/delete";
import { authenticate, optionalAuth } from "../middleware/auth";
import { generalRateLimit } from "../middleware/rateLimit";

const router = express.Router();

const postReadController = new PostReadController();
const postCreateController = new PostController();
const postUpdateController = new PostUpdateController();
const postDeleteController = new PostDeleteController();

// Public endpoints
router.get(
  "/",
  vRequestHeader,
  generalRateLimit,
  optionalAuth,
  (req, res, next) => postReadController.getPost(req, res, next)
);
router.get(
  "/summary",
  vRequestHeader,
  generalRateLimit,
  optionalAuth,
  (req, res, next) => postReadController.getPostSummary(req, res, next)
);

router.post(
  "/",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  vCreatePost,
  (req, res, next) => postCreateController.createPost(req as any, res, next)
);
router.put(
  "/:id",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  vUpdatePost,
  (req, res, next) => postUpdateController.updatePost(req as any, res, next)
);
router.delete(
  "/:id",
  vRequestHeader,
  authenticate,
  generalRateLimit,
  (req, res, next) => postDeleteController.deletePost(req as any, res, next)
);

export default router;
