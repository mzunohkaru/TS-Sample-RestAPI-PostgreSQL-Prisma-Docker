import { verify, sign } from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";

export async function generateToken(email: string): Promise<string> {
  const payload = {
    sub: email,
    role: "admin",
    // 有効期限:5分
    exp: Math.floor(Date.now() / 1000) + 60 * 5,
  };
  const secret = process.env.JWT_SECRET as string;
  const token = await sign(payload, secret);
  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = process.env.JWT_SECRET as string;
  const decoded = await verify(token, secret);
  return decoded;
}
