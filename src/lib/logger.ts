/**
 * Logger utility with log levels
 */

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4,
}

class Logger {
  private level: LogLevel = LogLevel.Info;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...args: any[]): void {
    if (this.level <= LogLevel.Debug) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.Info) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.Warn) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.Error) {
      console.error('[ERROR]', ...args);
    }
  }
}

export const logger = new Logger();
