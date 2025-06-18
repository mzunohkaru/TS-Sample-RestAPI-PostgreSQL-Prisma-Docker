# ビルド・品質チェックコマンド

## 概要
TypeScript コンパイル、Prisma スキーマ検証、コード品質チェックを実行します。

## 実行手順

1. **TypeScript コンパイルチェック**
   ```bash
   # 型チェック実行
   npx tsc --noEmit
   
   # ウォッチモード (開発時)
   npm run watch
   ```

2. **Prisma スキーマ検証**
   ```bash
   # スキーマ形式チェック
   npx prisma format
   
   # スキーマ検証
   npx prisma validate
   
   # クライアント生成 (型チェック含む)
   npm run db:generate
   ```

3. **データベース接続確認**
   ```bash
   # 接続テスト
   npx prisma db push --accept-data-loss
   
   # スタジオ起動で確認
   npm run studio
   ```

4. **総合チェック**
   ```bash
   # 全体ビルドチェック
   npx tsc && npm run db:generate
   ```

## CI/CD 用チェックリスト
- [ ] TypeScript コンパイルエラー 0
- [ ] Prisma スキーマ検証 OK
- [ ] 環境変数設定確認
- [ ] データベース接続確認
- [ ] JWT トークン生成/検証テスト

## エラー対応
- **型エラー**: `tsconfig.json` strict 設定確認
- **Prisma エラー**: スキーマとデータベース同期確認
- **接続エラー**: `.env` ファイルと Docker 起動状況確認