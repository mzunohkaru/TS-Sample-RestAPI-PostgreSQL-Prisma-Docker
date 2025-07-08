import express from "express";

import { vRequestHeader, vRegister, vUpdate } from "../middleware/validate";
import { UserCreateController } from "../controller/user/create";
import { UserReadController } from "../controller/user/read";
import { UserUpdateController } from "../controller/user/update";
import { UserDeleteController } from "../controller/user/delete";
import { authenticate, requireOwnership } from "../middleware/auth";
import { authRateLimit, generalRateLimit } from "../middleware/rateLimit";

const router = express.Router();

const userCreateController = new UserCreateController();
const userReadController = new UserReadController();
const userUpdateController = new UserUpdateController();
const userDeleteController = new UserDeleteController();

router.post("/register", authRateLimit, vRegister, (req, res, next) =>
  userCreateController.createUser(req, res, next)
);
router.post(
  "/:id",
  authenticate,
  requireOwnership(),
  vRegister,
  (req, res, next) => userCreateController.upsertUser(req, res, next)
);
router.get("/", generalRateLimit, (req, res, next) =>
  userReadController.getUsers(req, res, next)
);
router.get("/:id", generalRateLimit, (req, res, next) =>
  userReadController.getUserById(req, res, next)
);
router.put(
  "/:id",
  vRequestHeader,
  authenticate,
  requireOwnership(),
  vUpdate,
  (req, res, next) => userUpdateController.updateUser(req, res, next)
);
router.delete(
  "/:id",
  vRequestHeader,
  authenticate,
  requireOwnership(),
  (req, res, next) => userDeleteController.deleteUser(req, res, next)
);

export default router;
