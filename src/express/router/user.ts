import express from "express";

import { validateContentType, validateUserInput } from "../middleware/validate";
import { createUser, loginUser, upsertUser } from "../controller/user/create";
import { getUsers, getUserById } from "../controller/user/read";
import { updateUser } from "../controller/user/update";
import { deleteUser } from "../controller/user/delete";

const router = express.Router();

router.post("/register", validateContentType, validateUserInput, createUser);
router.post("/login", validateContentType, validateUserInput, loginUser);
router.post("/:id", validateContentType, validateUserInput, upsertUser);
router.get("/", validateContentType, getUsers);
router.get("/:id", validateContentType, getUserById);
router.put("/:id", validateContentType, updateUser);
router.delete("/:id", validateContentType, deleteUser);

export default router;