setup:
	@echo "Dockerコンテナを起動します..."
	@docker-compose -f docker-compose.local.yaml up --build
	@echo "Dockerコンテナが起動しました。"

down:
	docker-compose -f docker-compose.local.yaml down

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
	@echo "  shell         - アプリケーションコンテナにshellで入る"
	@echo "  down          - コンテナを停止"
	@echo "  clean         - Docker完全クリーンアップ"
	@echo "  restart       - 再起動"
	@echo "  reset         - 完全リセット"
	@echo "  help          - このヘルプを表示"