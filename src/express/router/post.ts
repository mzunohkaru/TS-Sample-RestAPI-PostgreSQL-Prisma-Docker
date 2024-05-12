import express from "express";

import { vContentType } from "../middleware/validate";
import { getPost, getPostSummary } from "../controller/post/read";

const router = express.Router();

router.get("/", vContentType, getPost);
router.get("/summary", vContentType, getPostSummary);

export default router;

