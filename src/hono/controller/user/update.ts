import { Context } from "hono";

import { prismaClient } from "../../../utils/db";
import { verifyToken } from "../../middleware/token";

export async function updateUserById(c: Context) {
  // TODO
  const id = c.req.param("id");
  const token = c.req.header("Authorization");
  if (!token) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const decoded = await verifyToken(token);
  if (decoded.role !== "admin") {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const user = await prismaClient.user.findUnique({ where: { id: parseInt(id) } });
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }
}
