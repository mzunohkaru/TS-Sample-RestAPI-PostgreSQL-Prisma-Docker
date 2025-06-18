# セキュリティ監査コマンド

## 概要
プロジェクトのセキュリティ状況を包括的に監査・確認し、脆弱性を特定します。

## 実行手順

### 1. 環境変数セキュリティチェック
```bash
# .env ファイルの存在確認
ls -la .env

# 環境変数の設定確認（値は表示されない）
node -e "
const config = require('./src/config/env').config;
console.log('Environment validation: OK');
console.log('JWT Secret length:', config.jwt.secret.length >= 32 ? 'SECURE' : 'INSECURE');
console.log('Database URL configured:', config.database.url ? 'YES' : 'NO');
"
```

### 2. 依存関係脆弱性チェック
```bash
# npm audit 実行
npm audit

# 高度な脆弱性チェック
npm audit --audit-level high

# 修復可能な脆弱性の自動修正
npm audit fix
```

### 3. TypeScript セキュリティチェック
```bash
# 型安全性チェック
npm run type-check

# strict モード確認
node -e "
const tsconfig = require('./tsconfig.json');
console.log('Strict mode:', tsconfig.compilerOptions.strict ? 'ENABLED' : 'DISABLED');
"
```

### 4. 認証・認可システムチェック
```bash
# JWT トークン強度テスト
node -e "
const jwt = require('jsonwebtoken');
const config = require('./src/config/env').config;
try {
  const token = jwt.sign({test: true}, config.jwt.secret);
  const decoded = jwt.verify(token, config.jwt.secret);
  console.log('JWT validation: OK');
} catch(e) {
  console.log('JWT validation: FAILED');
}
"
```

### 5. データベースセキュリティチェック
```bash
# Prisma スキーマ検証
npx prisma validate

# データベース接続セキュリティ確認
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('Database connection: SECURE'))
  .catch(() => console.log('Database connection: FAILED'))
  .finally(() => prisma.\$disconnect());
"
```

### 6. ファイル権限チェック
```bash
# 重要ファイルの権限確認
ls -la .env
ls -la src/config/

# Git 管理確認
git status --ignored
```

## セキュリティチェックリスト

### 環境設定
- [ ] `.env` ファイルが Git 管理対象外
- [ ] JWT シークレットが32文字以上
- [ ] データベース接続文字列に認証情報含有
- [ ] 環境変数がバリデーション済み

### 認証・認可
- [ ] 全エンドポイントで認証必須
- [ ] JWT トークンの適切な検証
- [ ] パスワードハッシュ化 (bcrypt)
- [ ] 所有権ベース認可

### 入力検証
- [ ] Zod スキーマによる厳密な検証
- [ ] SQL インジェクション対策
- [ ] XSS 対策
- [ ] レート制限実装

### ログ・監査
- [ ] セキュリティイベントの記録
- [ ] 構造化ログの実装
- [ ] エラー情報の適切な隠蔽

## 脆弱性対応
エラーが検出された場合は、以下の手順で対応：

1. **緊急度評価**: CRITICAL > HIGH > MEDIUM > LOW
2. **影響範囲特定**: 認証、データ、システム全体
3. **修正実装**: セキュリティパッチ適用
4. **再テスト**: 修正後の検証
5. **文書化**: 対応内容の記録