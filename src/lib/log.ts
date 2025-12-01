/**
 * @file This file provides a simple and extensible logging utility for the application.
 * It supports different log levels and can be configured to only output logs in
 * development mode, preventing verbose console output in production.
 */

// --- Type Definitions ---

/**
 * Defines the available log levels.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// --- Configuration ---

/**
 * Determines the current log level.
 * In a Vite project, `import.meta.env.DEV` is `true` for development and `false` for production.
 * We can use this to avoid logging sensitive or verbose information in production builds.
 *
 * - In development, we log everything from 'debug' up.
 * - In production, we only log 'warn' and 'error' to reduce noise.
 */
const CURRENT_LOG_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

const LOG_LEVEL_HIERARCHY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// --- Logger Class ---

class Logger {
  private context: string;

  /**
   * Creates a new Logger instance.
   * @param {string} [context='App'] - A name or context for the logger, which will be prepended to messages.
   */
  constructor(context: string = 'App') {
    this.context = context;
  }

  /**
   * Internal log method that handles level checking and formatting.
   * @param {LogLevel} level - The level of the log message.
   * @param {string} message - The main log message.
   * @param {any[]} [optionalParams] - Additional data to log.
   */
  private log(level: LogLevel, message: string, ...optionalParams: any[]): void {
    // Only log if the message's level is at or above the current configured log level
    if (LOG_LEVEL_HIERARCHY[level] < LOG_LEVEL_HIERARCHY[CURRENT_LOG_LEVEL]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${this.context}] [${level.toUpperCase()}] ${message}`;

    // Use the appropriate console method for the log level
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...optionalParams);
        break;
      case 'info':
        console.info(formattedMessage, ...optionalParams);
        break;
      case 'warn':
        console.warn(formattedMessage, ...optionalParams);
        break;
      case 'error':
        console.error(formattedMessage, ...optionalParams);
        // In the future, you could add integration with a third-party logging service here.
        // For example: Sentry.captureException(new Error(message), { extra: optionalParams });
        break;
    }
  }

  /**
   * Logs a 'debug' level message. These are useful for detailed diagnostic information during development.
   */
  public debug(message: string, ...optionalParams: any[]): void {
    this.log('debug', message, ...optionalParams);
  }

  /**
   * Logs an 'info' level message. Use this for general application flow messages.
   */
  public info(message: string, ...optionalParams: any[]): void {
    this.log('info', message, ...optionalParams);
  }

  /**
   * Logs a 'warn' level message. This should be used for potential issues that don't break the application.
   */
  public warn(message: string, ...optionalParams: any[]): void {
    this.log('warn', message, ...optionalParams);
  }

  /**
   * Logs an 'error' level message. This is for critical errors that have likely impacted the user.
   */
  public error(message: string, ...optionalParams: any[]): void {
    this.log('error', message, ...optionalParams);
  }
}

// --- Singleton Instance ---

/**
 * A default, app-wide logger instance.
 * You can also create new instances for specific components or modules, e.g., `new Logger('Auth')`.
 */
export const logger = new Logger();
