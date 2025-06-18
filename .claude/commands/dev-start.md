# プロフェッショナル開発環境起動コマンド

## 概要
セキュリティ・拡張性を重視したExpress.js開発サーバーを安全に起動します。

## クイックスタート

### 推奨: Express.js メイン実装
```bash
npm run dev:express
```

### 参考: Hono 実装（学習用）
```bash
npm run dev:hono
```

## 完全セットアップ手順

### 1. 環境変数セキュリティチェック
```bash
# .env ファイル確認
ls -la .env

# 環境変数バリデーション
node -e "require('./src/config/env'); console.log('Environment validation: PASSED')"
```

### 2. データベース環境準備
```bash
# PostgreSQL コンテナ起動
npm run docker:up

# 接続確認
npm run docker:logs

# Prisma Client 最新化
npm run db:generate
```

### 3. セキュリティ・品質チェック
```bash
# TypeScript 型チェック
npm run type-check

# ESLint チェック
npm run lint

# 依存関係脆弱性チェック
npm audit
```

### 4. 開発サーバー起動
```bash
# メイン実装 (Express.js + レイヤードアーキテクチャ)
npm run dev:express

# ログ確認: 以下が表示されることを確認
# - Server starting on port 3000
# - Database connected successfully
# - JWT configuration validated
# - Rate limiting enabled
```

## 起動後の動作確認

### API エンドポイント疎通テスト
```bash
# ヘルスチェック (認証なし)
curl http://localhost:3000/health

# ユーザー登録テスト
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"SecurePass123!"}'

# 認証テスト
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

### セキュリティ機能確認
```bash
# レート制限テスト (15分で100回制限)
for i in {1..5}; do curl http://localhost:3000/api/users; done

# JWT 認証テスト
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users/me
```

## トラブルシューティング

### 環境変数エラー
```bash
# 必須変数の確認
echo "DATABASE_URL: $DATABASE_URL"
echo "JWT_SECRET length: ${#JWT_SECRET}"

# .env.example をコピーして設定
cp .env.example .env
```

### データベース接続エラー
```bash
# Docker コンテナ状態確認
npm run docker:logs

# 強制再起動
npm run docker:rebuild

# Prisma 接続テスト
npx prisma db push --accept-data-loss
```

### ポート競合
```bash
# ポート使用状況確認
lsof -i :3000

# プロセス終了
kill -9 $(lsof -ti:3000)
```

### 型エラー・ESLint エラー
```bash
# 自動修正試行
npm run lint:fix

# 手動確認
npm run type-check
```

## 開発効率向上のヒント

1. **リアルタイム監視**: `npm run watch` で TypeScript コンパイル監視
2. **データベース管理**: `npm run studio` で GUI 操作
3. **ログ監視**: 構造化ログでリクエストトレーシング
4. **セキュリティ**: 定期的な `npm audit` 実行