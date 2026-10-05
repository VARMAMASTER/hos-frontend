export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(event: string, context?: LogContext): void;
  info(event: string, context?: LogContext): void;
  warn(event: string, context?: LogContext): void;
  error(event: string, context?: LogContext): void;
}

export type LogSink = Pick<Console, LogLevel>;

export interface LoggerOptions {
  level?: LogLevel;
  sink?: LogSink;
  now?: () => Date;
}

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createLogger({
  level = 'info',
  sink = console,
  now = () => new Date(),
}: LoggerOptions = {}): Logger {
  const emit =
    (entryLevel: LogLevel) =>
    (event: string, context: LogContext = {}) => {
      if (ORDER[entryLevel] < ORDER[level]) return;
      sink[entryLevel]({
        ...context,
        level: entryLevel,
        event,
        ts: now().toISOString(),
      });
    };
  return {
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
  };
}
