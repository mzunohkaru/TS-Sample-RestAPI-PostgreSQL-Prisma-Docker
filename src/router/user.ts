import express from "express";

import { vRequestHeader, vRegister, vUpdate } from "../middleware/validate";
import { createUser, upsertUser } from "../controller/user/create";
import { getUsers, getUserById } from "../controller/user/read";
import { updateUser } from "../controller/user/update";
import { deleteUser } from "../controller/user/delete";
import { authenticate, requireOwnership } from "../middleware/auth";
import { authRateLimit, generalRateLimit } from "../middleware/rateLimit";

const router = express.Router();

router.post("/register", authRateLimit, vRegister, createUser);
router.post("/:id", authenticate, requireOwnership(), vRegister, upsertUser);
router.get("/", generalRateLimit, getUsers);
router.get("/:id", generalRateLimit, getUserById);
router.put(
  "/:id",
  vRequestHeader,
  authenticate,
  requireOwnership(),
  vUpdate,
  updateUser,
);
router.delete(
  "/:id",
  vRequestHeader,
  authenticate,
  requireOwnership(),
  deleteUser,
);

export default router;
