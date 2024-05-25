# My Project

TypeScriptとPostgreSQLを使用したプロジェクトで、DockerコンテナとDocker Composeで実行されます。

## 前提条件

- Docker
- Node.js (>=20.x)
- npm

## セットアップ

1. 依存関係をインストール: `npm install --save-dev typescript ts-node @types/node prisma`
2. Prismaを初期化: `npx prisma init`
3. Dockerコンテナを起動: `make up`
4. データベースマイグレーションを適用: `npx prisma migrate dev --name <migration_name>`
5. Prismaが生成した、migration.sqlファイルに追加で記述
   ※Check制約
   ※CreateView SQLスクリプト
6. データベースに変更を反映する
   ※`npx prisma migrate deploy`
   ※`npx prisma migrate dev --create-only`

## 開発

開発サーバーを起動するには: `npm run dev`
サーバーは `http://localhost:3000` で稼働します。

## データベースマイグレーション

新しいマイグレーションを作成: `npx prisma migrate dev --name <migration_name>`
データベースをリセットし、すべてのマイグレーションを適用: `npx prisma migrate reset`

## データベースURL

`DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb?schema=public`

## データベース操作

### テーブル一覧

mydb=# `\dt;`
              List of relations
 Schema |        Name        | Type  | Owner  
--------+--------------------+-------+--------
 public | Post               | table | myuser
 public | User               | table | myuser

### 構造表示
mydb=# `\d "User";`

以下エラーが発生する
mydb=# \d User;
Did not find any relation named "User".

### Check制約
ALTER TABLE "users"
ADD CONSTRAINT "password_min_length"
CHECK (LENGTH("password") >= 6);

### プロダクション環境に適用
`npx prisma migrate deploy`

## 本番環境用ビルド

本番環境用にプロジェクトをビルドするには: `npm run build`
本番ビルドは `dist` ディレクトリにあります。

## Dockerコマンド

Dockerイメージをビルドする: `docker build -t my-project .`
Dockerコンテナを実行する: `docker run -p 3000:3000 my-project`


