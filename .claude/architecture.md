# APIサーバープロジェクト アーキテクチャ

## プロジェクト概要
TypeScript + Express + PostgreSQL + Prisma + Dockerを使用したREST APIサーバー

## 技術スタック

### Core Technologies
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16 Alpine
- **ORM**: Prisma (with Views support)
- **Containerization**: Docker + Docker Compose

### Key Dependencies
- **Authentication**: jsonwebtoken, bcrypt
- **Validation**: zod, express-validator
- **Security**: helmet, cors
- **Utilities**: uuid, axios, dotenv

### Development Tools
- **Build**: TypeScript Compiler
- **Development**: nodemon, ts-node
- **Code Quality**: ESLint, Prettier
- **Import Sorting**: @trivago/prettier-plugin-sort-imports

## アーキテクチャ構成

### ディレクトリ構造
```
src/
├── config/          # 環境設定
├── controller/      # ビジネスロジック
│   ├── auth/       # 認証関連
│   ├── post/       # 投稿関連
│   └── user/       # ユーザー関連
├── middleware/      # Express ミドルウェア
├── router/         # ルーティング定義
├── schema/         # バリデーションスキーマ
├── services/       # サービス層
└── utils/          # ユーティリティ
```

### レイヤードアーキテクチャ
1. **Router Layer** (`src/router/`)
   - ルーティング定義とミドルウェアの組み合わせ
   - Rate limiting、認証、バリデーション

2. **Controller Layer** (`src/controller/`)
   - HTTPリクエスト/レスポンスの処理
   - ビジネスロジックの実行

3. **Service Layer** (`src/services/`)
   - 再利用可能なビジネスロジック
   - データアクセス層との橋渡し

4. **Data Access Layer** (Prisma)
   - データベースアクセス
   - ORM操作

## セキュリティ機能

### 認証・認可
- JWT based authentication
- Token refresh mechanism
- Protected routes with ownership validation
- Password hashing with bcrypt

### Rate Limiting
- Auth endpoints: Strict rate limiting
- General endpoints: Standard rate limiting
- Different limits for different endpoint types

### Security Headers
- Helmet for security headers
- CORS configuration
- Request validation with zod/express-validator

## データベース設計

### Models
- **User**: ユーザー情報（UUID主キー）
- **Post**: 投稿情報（Userとのリレーション）

### Views
- **user_post_summary**: ユーザーと投稿のサマリービュー

### Features
- UUID primary keys for users
- Automatic timestamps (createdAt, updatedAt)
- Foreign key relationships
- Database views support