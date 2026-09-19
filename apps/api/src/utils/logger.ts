import { LogLevel, NodeEnv } from '../constants/enums';

function write(level: LogLevel, message: string, meta?: unknown): void {
  // Keep test output readable.
  if (process.env.NODE_ENV === NodeEnv.TEST) return;

  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const output =
    level === LogLevel.ERROR ? console.error : level === LogLevel.WARN ? console.warn : console.log;

  if (meta === undefined) output(line);
  else output(line, meta);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write(LogLevel.DEBUG, message, meta),
  info: (message: string, meta?: unknown) => write(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: unknown) => write(LogLevel.WARN, message, meta),
  error: (message: string, meta?: unknown) => write(LogLevel.ERROR, message, meta),
};
