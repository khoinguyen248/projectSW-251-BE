// src/utils/logger.js
// Winston logger configuration

import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format cho console
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { 
    service: 'tutor-system',
    environment: process.env.NODE_ENV 
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Info logs
    new winston.transports.File({ 
      filename: path.join('logs', 'info.log'), 
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'exceptions.log') 
    })
  ],
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'rejections.log') 
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      consoleFormat
    )
  }));
}

// Helper methods
logger.logRequest = (req) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.sub
  });
};

logger.logError = (err, req) => {
  logger.error('Error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: req ? {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.sub
    } : null
  });
};

logger.logAuth = (action, userId, email, success = true, reason = null) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Auth: ${action}`, {
    userId,
    email,
    success,
    reason
  });
};

logger.logDatabase = (action, collection, details = {}) => {
  logger.info('Database operation', {
    action,
    collection,
    ...details
  });
};

// Stream for Morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

export default logger;
