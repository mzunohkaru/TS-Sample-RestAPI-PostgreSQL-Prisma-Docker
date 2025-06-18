# TypeScript 設定

## tsconfig.json 設定方針
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs", 
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 重要な設定項目

### Strict Mode
- `strict: true` - 厳密な型チェック
- `noImplicitAny: true` - any型の暗黙的使用禁止
- `strictNullChecks: true` - null/undefined チェック

### パス解決
- `baseUrl: "./src"` - ベースパス設定
- `paths` - エイリアス設定 (必要に応じて)

### 出力設定
- `outDir: "./dist"` - コンパイル先
- `rootDir: "./src"` - ソースルート
- `declaration: true` - 型定義ファイル生成

## 開発時の型チェック
```bash
# リアルタイム型チェック
npm run watch

# 一回限りの型チェック  
npx tsc --noEmit
```