import { config } from '../config/env';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  requestId?: string;
  userId?: string;
}

class Logger {
  private logLevelMap: Record<string, LogLevel> = {
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG,
  };

  private currentLogLevel: LogLevel;

  constructor() {
    this.currentLogLevel = this.logLevelMap[config.logging.level] || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLogLevel;
  }

  private formatLog(level: string, message: string, meta?: any, context?: { requestId?: string; userId?: string }): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(meta && { meta }),
      ...(context?.requestId && { requestId: context.requestId }),
      ...(context?.userId && { userId: context.userId }),
    };
  }

  private output(logEntry: LogEntry): void {
    if (config.isProduction) {
      console.log(JSON.stringify(logEntry));
    } else {
      const { timestamp, level, message, meta, requestId, userId } = logEntry;
      const contextInfo = [requestId && `[${requestId}]`, userId && `[User: ${userId}]`].filter(Boolean).join(' ');
      const metaInfo = meta ? ` ${JSON.stringify(meta)}` : '';
      
      console.log(`${timestamp} [${level}]${contextInfo ? ` ${contextInfo}` : ''} ${message}${metaInfo}`);
    }
  }

  error(message: string, meta?: any, context?: { requestId?: string; userId?: string }): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatLog('error', message, meta, context));
    }
  }

  warn(message: string, meta?: any, context?: { requestId?: string; userId?: string }): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLog('warn', message, meta, context));
    }
  }

  info(message: string, meta?: any, context?: { requestId?: string; userId?: string }): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLog('info', message, meta, context));
    }
  }

  debug(message: string, meta?: any, context?: { requestId?: string; userId?: string }): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLog('debug', message, meta, context));
    }
  }

  // Security audit logging
  security(event: string, details: any, context?: { requestId?: string; userId?: string }): void {
    this.warn(`SECURITY: ${event}`, details, context);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: { requestId?: string; userId?: string }): void {
    this.info(`PERFORMANCE: ${operation}`, { duration: `${duration}ms` }, context);
  }

  // Database operation logging
  database(operation: string, table: string, duration?: number, context?: { requestId?: string; userId?: string }): void {
    this.debug(`DATABASE: ${operation} on ${table}`, duration ? { duration: `${duration}ms` } : undefined, context);
  }
}

export const logger = new Logger();