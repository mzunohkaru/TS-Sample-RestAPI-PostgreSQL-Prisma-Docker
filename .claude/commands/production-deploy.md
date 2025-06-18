# 本番環境デプロイコマンド

## 概要
セキュリティ・パフォーマンス・信頼性を重視した本番環境へのデプロイを実行します。

## デプロイ前チェックリスト

### 1. セキュリティ監査
```bash
# 脆弱性スキャン
npm audit --audit-level high

# 環境変数検証
node -e "
const config = require('./src/config/env').config;
console.log('JWT Secret length:', config.jwt.secret.length >= 32 ? 'SECURE' : 'INSECURE');
console.log('Environment:', config.env);
"

# TypeScript 型チェック
npm run type-check

# ESLint チェック
npm run lint
```

### 2. ビルド・テスト
```bash
# プロダクションビルド
npm run build

# ビルド成果物確認
ls -la dist/

# 基本動作テスト
NODE_ENV=production node dist/express/index.js &
sleep 2
curl http://localhost:3000/health
kill %1
```

### 3. データベース準備
```bash
# 本番用マイグレーション適用
npm run db:deploy

# Prisma Client 本番用生成
npm run db:generate
```

## 本番環境デプロイ手順

### Option A: Docker デプロイ
```bash
# 1. Dockerfile 最適化確認
cat Dockerfile

# 2. イメージビルド
docker build -t ts-rest-api:latest .

# 3. セキュリティスキャン
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ts-rest-api:latest

# 4. 本番起動
docker run -d \
  --name ts-rest-api-prod \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  ts-rest-api:latest

# 5. ヘルスチェック
curl http://localhost:3000/health
```

### Option B: PM2 デプロイ
```bash
# 1. PM2 インストール
npm install -g pm2

# 2. ecosystem.config.js 設定確認
cat ecosystem.config.js

# 3. 本番起動
pm2 start ecosystem.config.js --env production

# 4. プロセス確認
pm2 status
pm2 logs

# 5. 自動起動設定
pm2 startup
pm2 save
```

### Option C: クラウドデプロイ (例: AWS ECS)
```bash
# 1. AWS CLI 設定確認
aws sts get-caller-identity

# 2. ECR にイメージプッシュ
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com

docker tag ts-rest-api:latest 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/ts-rest-api:latest
docker push 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/ts-rest-api:latest

# 3. ECS サービス更新
aws ecs update-service \
  --cluster production-cluster \
  --service ts-rest-api-service \
  --force-new-deployment
```

## 本番環境設定

### 環境変数 (.env.production)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/prod_db
JWT_SECRET=your-very-secure-32-character-secret-key-here
JWT_REFRESH_SECRET=another-very-secure-32-character-refresh-secret
BCRYPT_ROUNDS=12
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Dockerfile 本番最適化
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runner
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs . .
RUN npm run build
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

## 監視・運用

### ヘルスチェック
```bash
# API ヘルスチェック
curl -f http://localhost:3000/health || exit 1

# データベース接続確認
curl -f http://localhost:3000/health/db || exit 1

# メモリ・CPU 使用量確認
docker stats ts-rest-api-prod
```

### ログ監視
```bash
# アプリケーションログ
docker logs -f ts-rest-api-prod

# システムリソース
top -p $(docker inspect -f '{{.State.Pid}}' ts-rest-api-prod)

# セキュリティ監査ログ
grep "SECURITY:" /var/log/app.log
```

### パフォーマンス監視
```bash
# レスポンス時間測定
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/users

# 接続数監視
netstat -an | grep :3000 | wc -l

# メモリリーク確認
ps aux | grep node
```

## ロールバック手順

### Docker ロールバック
```bash
# 1. 現在のイメージバックアップ
docker tag ts-rest-api:latest ts-rest-api:backup-$(date +%Y%m%d)

# 2. 前バージョンに戻す
docker stop ts-rest-api-prod
docker rm ts-rest-api-prod
docker run -d --name ts-rest-api-prod ts-rest-api:previous

# 3. データベースロールバック (必要に応じて)
# バックアップからリストア
```

### PM2 ロールバック
```bash
# 1. 前バージョンディレクトリに切り替え
cd /path/to/previous/version

# 2. サービス再起動
pm2 restart ts-rest-api

# 3. 確認
pm2 status
curl http://localhost:3000/health
```

## セキュリティ強化

### SSL/TLS 設定
```bash
# Let's Encrypt 証明書取得
certbot --nginx -d yourdomain.com

# SSL 設定確認
openssl s_client -connect yourdomain.com:443
```

### ファイアウォール設定
```bash
# UFW 基本設定
ufw default deny incoming
ufw default allow outgoing
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 定期セキュリティチェック
```bash
# 毎日実行する cron
0 2 * * * /usr/bin/npm audit --prefix /path/to/app
0 3 * * * /usr/bin/docker run --rm aquasec/trivy image ts-rest-api:latest
```