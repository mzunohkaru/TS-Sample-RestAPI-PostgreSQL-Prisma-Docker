import express from "express";

import { vRequestHeader } from "../middleware/validate";
import { getPost, getPostSummary } from "../controller/post/read";

const router = express.Router();

router.get("/", vRequestHeader, getPost);
router.get("/summary", vRequestHeader, getPostSummary);

export default router;

