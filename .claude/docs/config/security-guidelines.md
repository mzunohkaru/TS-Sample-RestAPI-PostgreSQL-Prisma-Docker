# セキュリティガイドライン

## 認証・認可セキュリティ

### JWT トークン管理
```typescript
// 推奨設定
const jwtConfig = {
  secret: process.env.JWT_SECRET, // 最低32文字
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: '15m', // 短期
  refreshTokenExpiry: '7d',  // 長期
  algorithm: 'HS256'
};

// セキュリティ強化のポイント
- アクセストークンは短期間 (15分)
- リフレッシュトークンで自動更新
- シークレットキーは環境変数で管理
- 定期的なキーローテーション
```

### パスワードセキュリティ
```typescript
// 強力なパスワードポリシー
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

// bcrypt 設定
const BCRYPT_ROUNDS = 12; // 最低10、推奨12

// 実装例
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 認可制御
```typescript
// 所有権ベース認可
const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const resourceId = req.params[resourceIdParam];
    if (resourceId !== req.user.userId) {
      throw new AuthorizationError('Access denied');
    }
    next();
  };
};

// 使用例
router.put('/users/:id', authenticate, requireOwnership(), updateUser);
```

## 入力検証・サニタイゼーション

### Zod スキーマ設計
```typescript
// 厳密な入力検証
const emailSchema = z.string()
  .email('Invalid email')
  .max(255)
  .toLowerCase()
  .transform(email => email.trim());

const nameSchema = z.string()
  .min(1, 'Name required')
  .max(100)
  .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters')
  .transform(name => name.trim());
```

### SQL インジェクション対策
```typescript
// Prisma ORM の使用 (推奨)
const user = await prisma.user.findUnique({
  where: { id: userId } // 自動的にエスケープ
});

// 動的クエリの場合
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = ${name}
`; // パラメータ化クエリ
```

### XSS 対策
```typescript
// 出力エスケープ
import xss from 'xss';

const sanitizeHtml = (input: string): string => {
  return xss(input, {
    whiteList: {}, // HTMLタグを全て除去
    stripIgnoreTag: true
  });
};

// 使用例
const sanitizedName = sanitizeHtml(req.body.name);
```

## レート制限・DDoS 対策

### 実装例
```typescript
// 認証エンドポイント (厳格)
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: 5,            // 5回まで
  message: 'Too many login attempts'
});

// 一般API (緩和)
const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  maxRequests: 100          // 100回まで
});

// 使用例
router.post('/auth/login', authRateLimit, login);
router.use('/api', generalRateLimit);
```

### IP ブラックリスト
```typescript
const blockedIPs = new Set(['192.168.1.100', '10.0.0.5']);

const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.socket.remoteAddress;
  if (blockedIPs.has(clientIP)) {
    logger.security('Blocked IP access attempt', { ip: clientIP });
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
```

## セキュリティヘッダー

### Express.js 設定
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
}));
```

## 監査ログ・モニタリング

### セキュリティイベント記録
```typescript
// セキュリティイベントの種類
enum SecurityEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// ログ実装
logger.security(SecurityEvent.LOGIN_FAILED, {
  email: req.body.email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
});
```

### 異常検知
```typescript
// 短時間での大量リクエスト検知
const suspiciousActivityThreshold = {
  requests: 50,
  timeWindow: 60000 // 1分
};

// 異なる IP からの同時ログイン検知
const detectMultipleLogins = async (userId: string, currentIP: string) => {
  const recentLogins = await getRecentLogins(userId, 5 * 60 * 1000); // 5分以内
  const differentIPs = recentLogins.filter(login => login.ip !== currentIP);
  
  if (differentIPs.length > 0) {
    logger.security('Multiple IP login detected', {
      userId,
      currentIP,
      previousIPs: differentIPs.map(l => l.ip)
    });
  }
};
```

## 環境・インフラセキュリティ

### 環境変数管理
```typescript
// 必須環境変数の検証
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET', 
  'DATABASE_URL'
];

const validateEnvironment = () => {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  
  // シークレットキーの強度チェック
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
};
```

### Docker セキュリティ
```dockerfile
# セキュリティ強化 Dockerfile
FROM node:18-alpine

# 非root ユーザー作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 必要最小限のパッケージのみインストール
RUN apk add --no-cache dumb-init

# アプリケーションファイル
WORKDIR /app
COPY --chown=nextjs:nodejs package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=nextjs:nodejs . .
RUN npm run build

# 非root ユーザーで実行
USER nextjs

# プロセス管理
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

## インシデント対応

### セキュリティインシデント発生時
1. **即座に実行**
   - 影響を受けたアカウントの無効化
   - 疑わしい IP アドレスのブロック
   - JWT トークンの全面無効化

2. **調査・分析**
   - ログの詳細分析
   - 攻撃パターンの特定
   - 影響範囲の確定

3. **対策・復旧**
   - 脆弱性の修正
   - セキュリティパッチの適用
   - システムの完全性確認

4. **事後対応**
   - インシデントレポート作成
   - 再発防止策の実装
   - セキュリティポリシーの見直し

### 緊急時コマンド
```bash
# 全ユーザーの強制ログアウト
redis-cli FLUSHDB  # JWT ブラックリスト使用時

# 特定IPのブロック
iptables -A INPUT -s 192.168.1.100 -j DROP

# アプリケーション緊急停止
pm2 stop all
docker stop $(docker ps -q)

# ログの緊急バックアップ
tar -czf security-logs-$(date +%Y%m%d-%H%M%S).tar.gz /var/log/
```