import express from "express";

import { vContentType, vRegister, vLogin, vUpdate } from "../middleware/validate";
import { createUser, loginUser, upsertUser } from "../controller/user/create";
import { getUsers, getUserById } from "../controller/user/read";
import { updateUser } from "../controller/user/update";
import { deleteUser } from "../controller/user/delete";

const router = express.Router();

router.post("/register", vContentType, vRegister, createUser);
router.post("/login", vContentType, vLogin, loginUser);
router.post("/:id", vContentType, vRegister, upsertUser);
router.get("/", vContentType, getUsers);
router.get("/:id", vContentType, getUserById);
router.put("/:id", vContentType, updateUser);
router.delete("/:id", vContentType, deleteUser);

export default router;