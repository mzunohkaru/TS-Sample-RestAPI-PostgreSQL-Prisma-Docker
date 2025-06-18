# Prisma 設定

## schema.prisma 基本設定
```prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## ログ設定
```javascript
// src/utils/db.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

## 環境変数設定
```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

## マイグレーション管理

### 開発環境
```bash
# マイグレーション作成・適用
npm run db:migrate

# リセット (開発時のみ)
npx prisma migrate reset
```

### 本番環境
```bash
# マイグレーション適用のみ
npm run db:deploy
```

## スキーマ設計原則
- UUID主キー使用
- created_at, updated_at 自動管理
- 外部キー制約必須
- インデックス設計考慮

## パフォーマンス最適化
- `include` vs `select` 適切な使い分け
- N+1問題対策 (batch loading)
- Connection pool 設定
- クエリ実行計画確認