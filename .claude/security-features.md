# Security Features Documentation

## 認証・認可システム

### JWT Authentication
- **Access Token**: 短期間有効（推奨: 15分）
- **Refresh Token**: 長期間有効（推奨: 7日）
- **Token Rotation**: リフレッシュ時に新しいトークンを発行

### Password Security
- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: デフォルト（10ラウンド）
- **Password Requirements**: 実装依存（バリデーション層で制御）

## Rate Limiting Strategy

### 認証関連エンドポイント (`authRateLimit`)
- **対象**: `/auth/login`, `/auth/verify`
- **制限**: より厳格な制限
- **目的**: ブルートフォース攻撃の防止

### 厳格な制限 (`strictRateLimit`)
- **対象**: `/auth/refresh`
- **制限**: 最も厳格な制限
- **目的**: トークンリフレッシュの悪用防止

### 一般的な制限 (`generalRateLimit`)
- **対象**: その他のエンドポイント
- **制限**: 標準的な制限
- **目的**: 一般的なAPI悪用の防止

## Access Control

### 認証ミドルウェア (`authenticate`)
- JWTトークンの検証
- ユーザー情報の抽出
- 認証失敗時のエラーハンドリング

### 所有者確認 (`requireOwnership`)
- リソースの所有者確認
- パラメータベースの認可制御
- 他ユーザーのリソースへの不正アクセス防止

### オプション認証 (`optionalAuth`)
- 認証が任意のエンドポイント用
- 認証済みユーザーには追加情報を提供
- 未認証ユーザーにも基本機能を提供

## Input Validation

### Zod Schema Validation
- 型安全なバリデーション
- 実行時型チェック
- カスタムエラーメッセージ

### Express Validator
- HTTPリクエストの詳細なバリデーション
- サニタイゼーション機能
- チェーンベースのバリデーション

### Request Header Validation (`vRequestHeader`)
- 必須ヘッダーの検証
- Content-Type の確認
- User-Agent の検証

## Security Headers

### Helmet.js Integration
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **X-XSS-Protection**: `1; mode=block`
- **Strict-Transport-Security**: HTTPS強制
- **Content-Security-Policy**: XSS防止

### CORS Configuration
- 許可されたオリジンの制御
- プリフライトリクエストの処理
- クレデンシャル付きリクエストの制御

## Database Security

### SQL Injection Prevention
- Prisma ORM使用によるパラメータ化クエリ
- 生のSQLクエリの制限
- 型安全なデータベースアクセス

### Connection Security
- 環境変数による接続情報管理
- SSL/TLS接続の推奨
- 接続プールの適切な設定

## Environment Security

### 環境変数管理
- **JWT_SECRET**: JWTの署名用シークレット
- **JWT_REFRESH_SECRET**: リフレッシュトークン用シークレット
- **DATABASE_URL**: データベース接続情報
- 機密情報の`.env`ファイル管理

### Docker Security
- **no-new-privileges**: 特権昇格の防止
- **Security Opt**: セキュリティオプションの設定
- **Network Isolation**: 専用ネットワークの使用

## Error Handling Security

### 情報漏洩防止
- 詳細なエラー情報の非表示
- 本番環境でのスタックトレース非表示
- 一般的なエラーメッセージの使用

### ログ管理
- セキュリティイベントのログ記録
- 機密情報のログ除外
- 適切なログレベルの設定

## セキュリティベストプラクティス

### Token Management
- トークンの適切な有効期限設定
- トークンローテーションの実装
- セキュアなトークン保存（HttpOnly Cookie推奨）

### API Security
- APIバージョニングの実装
- レスポンス形式の統一
- 適切なHTTPステータスコードの使用

### 監視・監査
- 不正アクセスの検知
- レート制限の監視
- 認証失敗の追跡

## 推奨する追加セキュリティ対策

### 本番環境での追加対策
1. **HTTPS必須化**
2. **API Gateway使用**
3. **WAF（Web Application Firewall）導入**
4. **DDoS保護**
5. **ログ監視システム**
6. **セキュリティスキャン**
7. **依存関係の脆弱性チェック**

### 定期的なセキュリティメンテナンス
- 依存関係の更新
- セキュリティパッチの適用
- アクセスログの分析
- ペネトレーションテストの実施