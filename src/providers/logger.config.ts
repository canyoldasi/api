import { LoggerOptions } from 'winston';
import * as winston from 'winston';
import { EmailTransport } from './logger-email-transpost';
import * as moment from 'moment-timezone';

const logLevel = process.env.LOG_LEVEL || 'info';

export const loggerConfig: LoggerOptions = {
  level: logLevel,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(({
          format: () => moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss.SSS'), // Türkiye saat dilimine göre format
        })),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new EmailTransport({level: 'error'})
  ],
};
