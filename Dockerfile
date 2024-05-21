# Dockerfile
FROM node:20.11.1

# タイムゾーンを東京に設定
ENV TZ=Asia/Tokyo

# アプリケーションディレクトリを作成
WORKDIR /usr/src/app

# アプリケーションの依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースをバンドル
COPY . .

# Prismaのクライアントを生成
RUN npx prisma generate

# ポート3000でアプリケーションを実行
EXPOSE 3000

# AWS ECSでのヘルスチェック
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:3000/ || exit 1

CMD [ "npm", "run", "start" ]