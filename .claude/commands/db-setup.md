# データベースセットアップコマンド

## 概要
Prisma を使用したデータベースの初期化から本番デプロイまでの一連の作業を自動化します。

## 実行手順

1. **開発環境セットアップ**
   ```bash
   # Prisma初期化 (初回のみ)
   npm run db:init
   
   # .envファイル設定確認
   cat .env
   ```

2. **マイグレーション作成・適用**
   ```bash
   # 新しいマイグレーション作成
   npm run db:migrate
   
   # Prisma Client生成
   npm run db:generate
   ```

3. **データベース確認**  
   ```bash
   # Prisma Studio起動
   npm run studio
   
   # シードデータ投入
   npm run db:seed
   ```

4. **本番環境デプロイ**
   ```bash
   # 本番マイグレーション適用
   npm run db:deploy
   ```

## 注意事項
- マイグレーション実行前は必ずバックアップを取る
- `db:migrate`は開発環境専用、本番では`db:deploy`を使用
- スキーマ変更時は必ず`db:generate`でクライアント再生成