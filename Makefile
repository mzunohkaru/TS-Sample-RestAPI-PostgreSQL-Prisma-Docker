up:
	@echo "Dockerコンテナを起動します..."
	@docker-compose -f docker-compose.local.yaml up
	@echo "Dockerコンテナが起動しました。"

# psgl:
# 	docker-compose exec postgres psql -U myuser -d mydb
psgl:
	docker-compose -f docker-compose.local.yaml exec postgres psql -U myuser -d mydb

down:
	docker-compose -f docker-compose.local.yaml down