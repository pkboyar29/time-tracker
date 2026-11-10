import winston from 'winston';
import expressWinston from 'express-winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d', // store 14 days
    }),
    // new winston.transports.File({
    //   filename: new Date().toISOString().split('T')[0] + '.log',
    // }),
  ],
});

export const loggerMiddleware = expressWinston.logger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d', // store 14 days
    }),
    // new winston.transports.File({
    //   filename: new Date().toISOString().split('T')[0] + '.log',
    // }),
  ],
  level: (req, res) => {
    if (res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  meta: true,
  dynamicMeta: (req, res) => {
    if (res.statusCode >= 400) {
      const safeBody = { ...req.body };
      delete safeBody.email;
      delete safeBody.password;
      return {
        requestBody: safeBody,
        responseBody: (res as any)._bodyForLog ? (res as any)._bodyForLog : {},
      };
    }

    return {};
  },
  msg: 'User {{res.locals.userId}}: HTTP {{req.method}} {{res.statusCode}} {{res.responseTime}}ms {{req.url}}',
  colorize: false,
});
