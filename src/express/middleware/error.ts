import { Request, Response, NextFunction } from 'express';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  res.status(500).json({
    message: err.message || 'サーバー内部でエラーが発生しました。',
  });
}

export default errorHandler;