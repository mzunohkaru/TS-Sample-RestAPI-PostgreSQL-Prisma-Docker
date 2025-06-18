# TS-PostgreSQL-Prisma-Docker REST API Project

## プロジェクト概要
プロフェッショナルレベルの TypeScript REST API プロジェクト（Express.js メイン実装）

### 技術スタック
- **言語**: TypeScript (Strict Mode)
- **フレームワーク**: Express.js (メイン), Hono (サブ実装)
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: JWT (Access/Refresh Token)
- **バリデーション**: Zod Schema
- **コンテナ**: Docker Compose
- **開発ツール**: ESLint, Nodemon

### アーキテクチャ (レイヤード設計)
```
src/
├── config/         # 環境設定・構成管理
├── express/        # Express.js 実装 (メイン)
│   ├── controllers/  # リクエスト処理
│   ├── middleware/   # 認証・ログ・エラー処理
│   ├── router/       # ルーティング
│   └── services/     # ビジネスロジック
├── schema/         # Zod バリデーションスキーマ
└── utils/          # 共通ユーティリティ
```

## 開発ルール

### 開発環境起動
```bash
# PostgreSQL 起動
npm run docker:up

# 開発サーバー (Express.js)
npm run dev:express

# データベース操作
npm run db:generate  # Prisma Client 生成
npm run studio       # データベース管理画面
```

### セキュリティ実装
- **認証**: JWT + リフレッシュトークン
- **認可**: 所有権ベース制御
- **入力検証**: 強力なパスワードポリシー + サニタイゼーション
- **レート制限**: IP/ユーザー別制限
- **監査ログ**: セキュリティイベント記録

### コーディング規約
- TypeScript Strict Mode 必須
- レイヤードアーキテクチャ遵守
- サービス層でビジネスロジック実装
- 統一エラーハンドリング (AppError クラス)
- 構造化ログ (本番/開発環境対応)
- 環境変数 Zod バリデーション

### 品質管理
```bash
# 型チェック
npm run type-check

# リント
npm run lint

# ビルド
npm run build
```

## 重要な設計原則

### 1. セキュリティファースト
- 全エンドポイントで認証必須
- パスワード複雑度チェック
- SQL インジェクション対策
- XSS 対策（入力サニタイゼーション）

### 2. 可観測性
- リクエスト ID によるトレーシング
- 構造化ログ
- パフォーマンス監視
- セキュリティ監査ログ

### 3. 拡張性
- サービス層による疎結合
- 依存性注入
- 設定の外部化
- レート制限の柔軟な設定

## 注意事項
- `.env` ファイルは Git 管理対象外
- JWT シークレットは最低32文字必須
- 本番環境では `npm run db:deploy` 使用
- Express 実装をメインとし、Hono 実装は参考程度