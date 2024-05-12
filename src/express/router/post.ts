import express from "express";

import { validateContentType, validateUserInput } from "../middleware/validate";
import { getPost, getPostSummary } from "../controller/post/read";

const router = express.Router();

router.get("/", validateContentType, getPost);
router.get("/summary", validateContentType, getPostSummary);

export default router;

