# Development Setup Guide

## 前提条件
- Node.js (推奨: 20.x)
- Docker & Docker Compose
- Git

## 環境構築

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env`ファイルを作成し、以下の設定を追加：
```env
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb?schema=public
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### 3. Dockerでの開発環境起動

#### PostgreSQLとアプリケーションの起動
```bash
npm run docker:up
```

#### ログの確認
```bash
npm run docker:logs
```

#### コンテナの停止
```bash
npm run docker:down
```

#### 環境の再構築
```bash
npm run docker:rebuild
```

### 4. データベース初期化

#### マイグレーション実行
```bash
# ローカル環境
npm run db:generate
npm run db:migrate

# Docker環境
npm run docker:db:deploy
```

#### シードデータの投入
```bash
# ローカル環境
npm run db:seed

# Docker環境
npm run docker:db:seed
```

## 開発コマンド

### アプリケーション実行
```bash
# 開発サーバー起動（ホットリロード）
npm run dev:express

# ビルド
npm run build

# 本番環境起動
npm start
```

### コード品質
```bash
# Lint実行
npm run lint

# Lint自動修正
npm run lint:fix

# コードフォーマット
npm run format

# 型チェック
npm run type-check

# TypeScriptウォッチモード
npm run watch
```

### データベース操作
```bash
# Prismaクライアント生成
npm run db:generate

# マイグレーション作成（インタラクティブ）
npm run db:migrate

# マイグレーション適用
npm run db:deploy

# シードデータ投入
npm run db:seed
```

### Docker操作
```bash
# サービス起動
npm run docker:up

# サービス停止
npm run docker:down

# ログ確認
npm run docker:logs

# 環境再構築
npm run docker:rebuild

# コンテナ内でのシェル実行
npm run docker:exec

# Docker環境でのDB操作
npm run docker:db:deploy
npm run docker:db:seed
```

## ディレクトリ構成の詳細

### `/src`
- **config/**: 環境設定ファイル
- **controller/**: API コントローラー
- **middleware/**: Express ミドルウェア
- **router/**: ルーティング定義
- **schema/**: バリデーションスキーマ
- **services/**: ビジネスロジック
- **utils/**: ユーティリティ関数

### `/prisma`
- **schema.prisma**: データベーススキーマ定義
- **migrations/**: マイグレーションファイル
- **seed.ts**: シードデータ
- **views/**: データベースビュー定義

### `/docker`
- **postgres/**: PostgreSQL設定ファイル

## 開発フロー

1. **機能開発**
   ```bash
   npm run dev:express  # 開発サーバー起動
   ```

2. **コード品質チェック**
   ```bash
   npm run lint        # Lint実行
   npm run type-check  # 型チェック
   npm run format      # フォーマット
   ```

3. **データベース変更**
   ```bash
   # schema.prisma編集後
   npm run db:migrate  # マイグレーション作成
   npm run db:generate # クライアント再生成
   ```

## デバッグとトラブルシューティング

### Docker環境のリセット
```bash
docker-compose -f docker-compose.local.yaml down -v
npm run docker:rebuild
```

### ログ確認
```bash
# アプリケーションログ
npm run docker:logs

# 特定のサービスのログ
docker-compose -f docker-compose.local.yaml logs -f app
docker-compose -f docker-compose.local.yaml logs -f postgres
```

### データベース接続確認
```bash
# PostgreSQL接続テスト
docker exec -it ts-sample-restapi-postgresql-prisma-docker-postgres-1 psql -U myuser -d mydb
```