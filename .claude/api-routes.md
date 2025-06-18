# API Routes Documentation

## Authentication Routes (`/auth`)

### Public Endpoints
- `POST /auth/login` - ユーザーログイン
  - Rate Limit: authRateLimit
  - Validation: vLogin
  - Controller: login

- `POST /auth/refresh` - トークンリフレッシュ  
  - Rate Limit: strictRateLimit
  - Validation: vRefreshToken
  - Controller: refreshToken

- `POST /auth/verify` - トークン検証
  - Rate Limit: authRateLimit
  - Validation: vVerifyToken
  - Controller: verifyToken

### Protected Endpoints
- `POST /auth/logout` - ログアウト
  - Middleware: authenticate
  - Validation: vRequestHeader
  - Controller: logout

- `GET /auth/me` - 現在のユーザー情報取得
  - Middleware: authenticate
  - Rate Limit: generalRateLimit
  - Validation: vRequestHeader
  - Controller: me

## User Routes (`/user`)

### Public Endpoints
- `POST /user/register` - ユーザー登録
  - Rate Limit: authRateLimit
  - Validation: vRegister
  - Controller: createUser

- `GET /user/` - ユーザー一覧取得
  - Rate Limit: generalRateLimit
  - Controller: getUsers

- `GET /user/:id` - 特定ユーザー取得
  - Rate Limit: generalRateLimit
  - Controller: getUserById

### Protected Endpoints
- `POST /user/:id` - ユーザー作成/更新（Upsert）
  - Middleware: authenticate, requireOwnership
  - Validation: vRegister
  - Controller: upsertUser

- `PUT /user/:id` - ユーザー更新
  - Middleware: authenticate, requireOwnership
  - Validation: vRequestHeader, vUpdate
  - Controller: updateUser

- `DELETE /user/:id` - ユーザー削除
  - Middleware: authenticate, requireOwnership
  - Validation: vRequestHeader
  - Controller: deleteUser

## Post Routes (`/post`)

### Public Endpoints
- `GET /post/` - 投稿一覧取得
  - Rate Limit: generalRateLimit
  - Middleware: optionalAuth (認証は任意)
  - Validation: vRequestHeader
  - Controller: getPost

- `GET /post/summary` - 投稿サマリー取得
  - Rate Limit: generalRateLimit
  - Middleware: optionalAuth (認証は任意)
  - Validation: vRequestHeader
  - Controller: getPostSummary

## Middleware Summary

### Rate Limiting
- `authRateLimit`: 認証関連エンドポイント用
- `strictRateLimit`: 厳格な制限が必要なエンドポイント用
- `generalRateLimit`: 一般的なエンドポイント用

### Authentication
- `authenticate`: 認証必須のエンドポイント用
- `optionalAuth`: 認証が任意のエンドポイント用
- `requireOwnership()`: リソースの所有者確認用

### Validation
- `vLogin`: ログイン用バリデーション
- `vRegister`: 登録用バリデーション
- `vUpdate`: 更新用バリデーション
- `vRequestHeader`: リクエストヘッダーバリデーション
- `vRefreshToken`: リフレッシュトークンバリデーション
- `vVerifyToken`: トークン検証用バリデーション