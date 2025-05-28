// utils/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create transports
const transports = [];

// Console transport (always enabled in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
} else {
  // In production, only log warnings and errors to console
  transports.push(
    new winston.transports.Console({
      level: 'warn',
      format: consoleFormat,
    })
  );
}

// File transports for production and development
transports.push(
  // Error log - only errors
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
  }),

  // Combined log - all levels
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true,
  })
);

// HTTP access log (for Express requests)
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format: logFormat,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  ],
  exitOnError: false,
});

// Add HTTP request logging middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the request
  logger.http(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
    userId: req.user?.id || null,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    logger.http(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id || null,
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Security event logger
const logSecurityEvent = (event, details = {}) => {
  logger.warn(`SECURITY: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Rate limit event logger
const logRateLimit = (ip, endpoint, details = {}) => {
  logger.warn(`RATE_LIMIT: IP ${ip} exceeded rate limit on ${endpoint}`, {
    type: 'rate_limit',
    ip,
    endpoint,
    ...details
  });
};

// Authentication event logger
const logAuth = (event, userId, details = {}) => {
  logger.info(`AUTH: ${event}`, {
    type: 'auth',
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Database event logger
const logDatabase = (event, details = {}) => {
  logger.info(`DB: ${event}`, {
    type: 'database',
    event,
    ...details
  });
};

// Error event logger with context
const logError = (error, context = {}) => {
  logger.error(error.message || 'Unknown error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context
  });
};

module.exports = {
  logger,
  httpLogger,
  logSecurityEvent,
  logRateLimit,
  logAuth,
  logDatabase,
  logError
};