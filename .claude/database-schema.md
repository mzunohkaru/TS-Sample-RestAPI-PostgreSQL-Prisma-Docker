# Database Schema Documentation

## データベース設計

### 使用技術
- **Database**: PostgreSQL 16 Alpine
- **ORM**: Prisma (with Views support)
- **Connection**: Docker Compose networking

## テーブル構造

### Users テーブル
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Prisma Schema:**
```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  name      String?
  email     String   @unique
  password  String   @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  posts     Post[]   @relation("WrittenPosts")

  @@map("users")
}
```

### Posts テーブル
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Prisma Schema:**
```prisma
model Post {
  id        Int      @id @default(autoincrement())
  userId    String   @db.Uuid
  title     String
  content   String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  user      User     @relation("WrittenPosts", fields: [userId], references: [id])

  @@map("posts")
}
```

## Database Views

### user_post_summary ビュー
```sql
CREATE VIEW user_post_summary AS
SELECT 
    p.id,
    u.name,
    p.title
FROM posts p
LEFT JOIN users u ON p.user_id = u.id;
```

**Prisma Schema:**
```prisma
view user_post_summary {
  id    Int     @id
  name  String?
  title String?
}
```

## リレーションシップ

### User → Post (1:N)
- 1人のユーザーは複数の投稿を持つことができる
- `posts.user_id` が `users.id` を参照
- 外部キー制約あり

## インデックス戦略

### 自動作成されるインデックス
- `users.id` (PRIMARY KEY)
- `users.email` (UNIQUE)
- `posts.id` (PRIMARY KEY)
- `posts.user_id` (FOREIGN KEY)

## データ型の選択理由

### UUID for User ID
- グローバルに一意
- 推測困難（セキュリティ）
- 分散システムでの一意性保証

### Serial for Post ID
- 投稿の順序性を保持
- パフォーマンス優位
- 内部的な識別子として使用

### VARCHAR(255) for Password
- bcryptハッシュの固定長に対応
- 十分な長さを確保

## マイグレーション履歴

### 20250618020345_init
- 初期テーブル作成
- User, Postテーブルの定義

### 20250618021301_update_uuid
- UUID型の更新
- 外部キー制約の調整

## セキュリティ考慮事項

### パスワードハッシュ化
- bcryptを使用
- ソルトラウンド数: デフォルト（10）

### 外部キー制約
- データ整合性の保証
- カスケード削除の制御

## パフォーマンス考慮事項

### Connection Pooling
- Prismaの自動接続プール管理
- デフォルト設定を使用

### Query Optimization
- 適切なインデックス設計
- N+1問題の回避（Prisma include/select）

## Backup & Recovery

### Docker Volume
- `postgres-data` volume for persistence
- ローカル開発環境でのデータ永続化

### 本番環境推奨事項
- 定期的なpg_dumpバックアップ
- Point-in-time recovery設定
- レプリケーション設定