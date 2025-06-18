# Docker 設定

## docker-compose.local.yaml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 環境変数管理
```bash
# .env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=myapp
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp?schema=public"
```

## 開発環境起動手順
```bash
# PostgreSQL起動
docker-compose -f docker-compose.local.yaml up -d

# 接続確認
docker-compose -f docker-compose.local.yaml ps

# ログ確認
docker-compose -f docker-compose.local.yaml logs postgres
```

## 本番環境設定考慮事項
- ヘルスチェック設定
- リソース制限 (CPU/Memory)
- セキュリティ設定 (非root実行)
- ボリューム永続化
- ネットワーク分離

## Dockerfile 最適化
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係インストール (キャッシュ効率化)
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコピー
COPY . .

# Prisma Client生成
RUN npx prisma generate

# 非root実行
USER node

EXPOSE 3000
CMD ["npm", "start"]
```