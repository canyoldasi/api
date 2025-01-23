import { LoggerOptions } from 'winston';
import * as winston from 'winston';
import { EmailTransport } from './logger-email-transport';
import * as moment from 'moment-timezone';

const format = winston.format.combine(
  winston.format.timestamp({
    format: () => moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss.SSS'),
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`),
);

export const loggerConfig: LoggerOptions = {
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: format,
    }),
    new winston.transports.File({ format: format, filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ format: format, filename: 'logs/combined.log' }),
    new EmailTransport({
      level: 'error',
      handleExceptions: true,
      format: format,
    }),
  ],
  exitOnError: false,
};
