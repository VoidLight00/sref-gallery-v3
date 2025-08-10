import winston from 'winston';
import { DateTime } from 'luxon';

// Custom timestamp format
const timestampFormat = winston.format.timestamp({
  format: () => DateTime.now().toISO()
});

// Console format for development
const consoleFormat = winston.format.combine(
  timestampFormat,
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'API'}] ${level}: ${message} ${metaString}`;
  })
);

// JSON format for production
const jsonFormat = winston.format.combine(
  timestampFormat,
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'sref-gallery-api'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat
    }),
  ],
});

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));

  // Combined log file
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

// Add request logging helper
export const logRequest = (req: any, res: any, duration?: number) => {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    statusCode: res.statusCode,
    duration: duration ? `${duration}ms` : undefined,
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Add database query logging helper
export const logQuery = (query: string, params?: any[], duration?: number) => {
  if (process.env.DEV_LOG_QUERIES === 'true') {
    logger.debug('Database Query', {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
};

// Add error logging helper
export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Add security event logging
export const logSecurityEvent = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: DateTime.now().toISO(),
  });
};

// Add performance logging
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  const level = duration > 1000 ? 'warn' : 'info';
  logger.log(level, 'Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

// Stream interface for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;