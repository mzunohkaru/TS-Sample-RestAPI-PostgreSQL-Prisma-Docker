setup:
	@echo "Dockerコンテナを起動します..."
	@docker-compose -f docker-compose.local.yaml up --build
	@echo "Dockerコンテナが起動しました。"

ps:
	docker-compose -f docker-compose.local.yaml ps

bash:
	docker-compose -f docker-compose.local.yaml exec postgres bash

# psgl:
# 	docker-compose exec postgres psql -U myuser -d mydb
psgl:
	docker-compose -f docker-compose.local.yaml exec postgres psql -U myuser -d mydb

down:
	docker-compose -f docker-compose.local.yaml down

# Database Migration (ホストから実行)
db-deploy:
	@echo "データベースマイグレーションを実行します（ホストから）..."
	@DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb?schema=public npx prisma migrate deploy

# Database Migration (Dockerコンテナ内で実行)
db-deploy-docker:
	@echo "データベースマイグレーションを実行します（Docker内で）..."
	@docker exec ts-sample-restapi-postgresql-prisma-docker-app-1 npm run db:deploy:docker

# Database Seed (ホストから実行)
db-seed:
	@echo "データベースにシードデータを投入します（ホストから）..."
	@DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb?schema=public ts-node prisma/seed.ts

# Database Seed (Dockerコンテナ内で実行)
db-seed-docker:
	@echo "データベースにシードデータを投入します（Docker内で）..."
	@docker exec ts-sample-restapi-postgresql-prisma-docker-app-1 npm run db:seed:docker

# Prisma Studio (ホストから実行)
studio:
	@echo "Prisma Studioを起動します..."
	@DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb?schema=public npx prisma studio

# データベース初期化（マイグレーション + シード）
db-init:
	@echo "データベースを初期化します..."
	@make db-deploy
	@make db-seed

# 完全クリーンアップ（ボリュームとネットワークも削除）
clean:
	@echo "Docker リソースをクリーンアップします..."
	@docker-compose -f docker-compose.local.yaml down -v --remove-orphans
	@docker system prune -f
	@echo "クリーンアップが完了しました。"

# 安全な起動（クリーンアップしてから起動）
restart:
	@echo "Docker環境を再構築します..."
	@make clean
	@make setup

# 完全リセット（クリーンアップ + セットアップ + DB初期化）
reset:
	@echo "プロジェクトを完全リセットします..."
	@make clean
	@make setup
	@sleep 10
	@make db-init
	@echo "リセットが完了しました。"

# アプリケーションコンテナにshellで入る
shell:
	@docker exec -it ts-sample-restapi-postgresql-prisma-docker-app-1 /bin/sh

# ヘルプ
help:
	@echo "利用可能なコマンド:"
	@echo "  setup         - Dockerコンテナを起動"
	@echo "  ps            - コンテナ状態を確認"
	@echo "  bash          - PostgreSQLコンテナにbashで入る"
	@echo "  shell         - アプリケーションコンテナにshellで入る"
	@echo "  psql          - PostgreSQLに接続"
	@echo "  down          - コンテナを停止"
	@echo "  db-deploy     - マイグレーション実行（ホストから）"
	@echo "  db-deploy-docker - マイグレーション実行（Docker内で）"
	@echo "  db-seed       - シードデータ投入（ホストから）"
	@echo "  db-seed-docker - シードデータ投入（Docker内で）"
	@echo "  db-init       - DB初期化（マイグレーション + シード）"
	@echo "  studio        - Prisma Studio起動"
	@echo "  clean         - Docker完全クリーンアップ"
	@echo "  restart       - 再起動"
	@echo "  reset         - 完全リセット"
	@echo "  help          - このヘルプを表示"