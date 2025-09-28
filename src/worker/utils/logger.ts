/**
 * Structured Logging Utility
 *
 * 구조화된 로깅 시스템
 */

import { type ExtractionErrorType } from '../types/errors';
import { type ContentPlatform } from '../types/extraction';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface BaseLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

export interface ExtractionLogEntry extends BaseLogEntry {
  platform?: ContentPlatform | 'unknown';
  url?: string;
  processingTime?: number;
  extractedFields?: string[];
  contentLength?: number;
  errorType?: ExtractionErrorType;
  retryAttempt?: number;
  userAgent?: string;
}

export interface PerformanceLogEntry extends BaseLogEntry {
  operation: string;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  metadata?: Record<string, unknown>;
}

export interface SecurityLogEntry extends BaseLogEntry {
  event: 'rate_limit' | 'invalid_request' | 'suspicious_activity';
  clientIp?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Logger Class
// ============================================================================

export class Logger {
  private static instance: Logger;
  private readonly environment: string;
  private readonly serviceName: string;
  private readonly version: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.serviceName = 'textify-content-extraction';
    this.version = '1.0.0';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // ============================================================================
  // Core Logging Methods
  // ============================================================================

  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>,
  ): void {
    const errorMetadata = {
      ...metadata,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
    };
    this.log(LogLevel.ERROR, message, errorMetadata);
  }

  public fatal(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>,
  ): void {
    const errorMetadata = {
      ...metadata,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
    };
    this.log(LogLevel.FATAL, message, errorMetadata);
  }

  // ============================================================================
  // Specialized Logging Methods
  // ============================================================================

  public logExtractionStart(
    requestId: string,
    url: string,
    platform: ContentPlatform | 'unknown',
    options?: Record<string, unknown>,
  ): void {
    const entry: ExtractionLogEntry = {
      level: LogLevel.INFO,
      message: 'Content extraction started',
      timestamp: new Date().toISOString(),
      requestId,
      platform,
      url,
      ...options,
    };
    this.output(entry);
  }

  public logExtractionSuccess(
    requestId: string,
    url: string,
    platform: ContentPlatform,
    processingTime: number,
    extractedFields: string[],
    contentLength?: number,
  ): void {
    const entry: ExtractionLogEntry = {
      level: LogLevel.INFO,
      message: 'Content extraction successful',
      timestamp: new Date().toISOString(),
      requestId,
      platform,
      url,
      processingTime,
      extractedFields,
      contentLength,
    };
    this.output(entry);
  }

  public logExtractionError(
    requestId: string,
    url: string,
    platform: ContentPlatform | 'unknown',
    errorType: ExtractionErrorType,
    _errorMessage: string,
    processingTime: number,
    retryAttempt?: number,
  ): void {
    const entry: ExtractionLogEntry = {
      level: LogLevel.ERROR,
      message: 'Content extraction failed',
      timestamp: new Date().toISOString(),
      requestId,
      platform,
      url,
      errorType,
      processingTime,
      retryAttempt,
    };
    this.output(entry);
  }

  public logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: PerformanceLogEntry = {
      level: LogLevel.INFO,
      message: `Performance metric: ${operation}`,
      timestamp: new Date().toISOString(),
      operation,
      duration,
      metadata,
    };
    this.output(entry);
  }

  public logSecurity(
    event: SecurityLogEntry['event'],
    message: string,
    clientIp?: string,
    userAgent?: string,
    details?: Record<string, unknown>,
  ): void {
    const entry: SecurityLogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      event,
      clientIp,
      userAgent,
      details,
    };
    this.output(entry);
  }

  public logHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    requestId?: string,
    clientIp?: string,
    userAgent?: string,
  ): void {
    const level =
      statusCode >= 500
        ? LogLevel.ERROR
        : statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;

    const entry = {
      level,
      message: `HTTP ${method} ${path} ${statusCode}`,
      timestamp: new Date().toISOString(),
      requestId,
      method,
      path,
      statusCode,
      responseTime,
      clientIp,
      userAgent,
    };
    this.output(entry);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: BaseLogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    this.output(entry);
  }

  private output(
    entry:
      | BaseLogEntry
      | ExtractionLogEntry
      | PerformanceLogEntry
      | SecurityLogEntry,
  ): void {
    const logEntry = {
      ...entry,
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
    } as typeof entry & {
      service: string;
      version: string;
      environment: string;
    };

    // 개발 환경에서는 콘솔에 예쁘게 출력
    if (this.environment === 'development') {
      this.prettyPrint(logEntry);
    } else {
      // 프로덕션에서는 JSON으로 출력
      const output =
        entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL
          ? console.error
          : console.log;
      output(JSON.stringify(logEntry));
    }
  }

  private prettyPrint(
    entry: (
      | BaseLogEntry
      | ExtractionLogEntry
      | PerformanceLogEntry
      | SecurityLogEntry
    ) & { service?: string; version?: string; environment?: string },
  ): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };
    const reset = '\x1b[0m';
    const color = colors[entry.level as LogLevel] || '';

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);

    console.log(`${color}[${timestamp}] ${level}${reset} ${entry.message}`);

    // 추가 메타데이터가 있으면 출력
    const {
      level: _,
      message: __,
      timestamp: ___,
      service: ____,
      version: _____,
      environment: ______,
      ...metadata
    } = entry;
    if (Object.keys(metadata).length > 0) {
      console.log(`${color}       ${reset}`, JSON.stringify(metadata, null, 2));
    }
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

export const logger = Logger.getInstance();

// ============================================================================
// Utility Functions
// ============================================================================

export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, metadata?: Record<string, unknown>) =>
      logger.debug(message, { requestId, ...metadata }),
    info: (message: string, metadata?: Record<string, unknown>) =>
      logger.info(message, { requestId, ...metadata }),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      logger.warn(message, { requestId, ...metadata }),
    error: (
      message: string,
      error?: Error | unknown,
      metadata?: Record<string, unknown>,
    ) => logger.error(message, error, { requestId, ...metadata }),
    fatal: (
      message: string,
      error?: Error | unknown,
      metadata?: Record<string, unknown>,
    ) => logger.fatal(message, error, { requestId, ...metadata }),
  };
}

export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    fn()
      .then((result) => {
        const duration = Date.now() - startTime;
        logger.logPerformance(operation, duration, metadata);
        resolve(result);
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        logger.logPerformance(`${operation}_failed`, duration, {
          ...metadata,
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      });
  });
}

export function withLogging<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    return measurePerformance(operation, () => fn(...args));
  };
}
