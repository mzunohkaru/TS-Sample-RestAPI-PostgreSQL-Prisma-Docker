import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import prisma from "../../utils/db";

export function generateTokens(emailData: string) {
  // JWTの発行
  const token = jwt.sign(
    { email: emailData },
    process.env.TOKEN_SECRET_KEY as string,
    {
      expiresIn: "1h",
    }
  );

  // リフレッシュトークンの発行
  const refreshToken = jwt.sign(
    { email: emailData },
    process.env.REFRESH_TOKEN_SECRET_KEY as string,
    {
      expiresIn: "7d",
    }
  );

  return { token, refreshToken };
}

// JWTトークンを復号する処理
function tokenDecode(req: Request) {
  // リクエストヘッダーの"authorization"を取得
  const bearerHeader = req.headers.authorization;

  // 認証情報が存在する場合
  if (bearerHeader) {
    // トークンを取得
    const bearer = bearerHeader.split(" ")[1];
    try {
      // トークンを復号
      const decodedToken = jwt.verify(
        bearer,
        process.env.TOKEN_SECRET_KEY as string
      );

      return decodedToken;
    } catch {
      return false;
    }
  } else {
    return false;
  }
}

// JWTを検証するためのミドルウェア
export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 復号したトークンを取得
  const decodedToken = tokenDecode(req);

  // トークンが存在する場合
  if (decodedToken) {
    // ユーザーを取得（トークンはもともとユーザーのIDから生成したものであるため検索可能）
    const user = await prisma.user.findUnique({
      where: { email: (decodedToken as any).email },
    });

    // ユーザーが存在しない場合
    if (!user) {
      return res.status(401).json("Unauthorized");
    }

    // リクエスト情報を取得したユーザーで上書き
    req.body.user = user;
    next();
  } else {
    return res.status(401).json("Unauthorized");
  }
}
