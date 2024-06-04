import express from "express";

import {
  vRequestHeader,
  vRegister,
  vLogin,
  vUpdate,
} from "../middleware/validate";
import { createUser, loginUser, upsertUser } from "../controller/user/create";
import { getUsers, getUserById } from "../controller/user/read";
import { updateUser } from "../controller/user/update";
import { deleteUser } from "../controller/user/delete";
import { verifyToken } from "../middleware/token";

const router = express.Router();

router.post("/register", vRegister, createUser);
router.post("/login", vLogin, loginUser);
router.post("/:id", vRegister, upsertUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", vRequestHeader, verifyToken, vUpdate, updateUser);
router.delete("/:id", vRequestHeader, deleteUser);

export default router;
