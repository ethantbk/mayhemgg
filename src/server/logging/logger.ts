import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean | null | undefined>;

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
};

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "mayhemgg",
    ...context
  };

  const serializedEntry = JSON.stringify(entry);

  if (level === "error") {
    console.error(serializedEntry);
    return;
  }

  if (level === "warn") {
    console.warn(serializedEntry);
    return;
  }

  console.log(serializedEntry);
}

export function createLogger(defaultContext: LogContext = {}): Logger {
  return {
    debug: (message, context) => writeLog("debug", message, { ...defaultContext, ...context }),
    info: (message, context) => writeLog("info", message, { ...defaultContext, ...context }),
    warn: (message, context) => writeLog("warn", message, { ...defaultContext, ...context }),
    error: (message, context) => writeLog("error", message, { ...defaultContext, ...context })
  };
}

export const logger = createLogger();
