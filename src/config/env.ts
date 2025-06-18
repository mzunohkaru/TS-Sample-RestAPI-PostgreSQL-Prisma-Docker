import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url("Invalid database URL"),

  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT refresh secret must be at least 32 characters"),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
};

const env = parseEnv();

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",

  database: {
    url: env.DATABASE_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: env.JWT_REFRESH_TOKEN_EXPIRY,
  },

  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
