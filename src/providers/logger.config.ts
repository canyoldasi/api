import { LoggerOptions } from 'winston';
import * as winston from 'winston';
import * as moment from 'moment-timezone';

// Ortak format (renksiz)
const commonFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss.SSS'),
  }),
  winston.format.printf(({ timestamp, level, message, stack, context }) => `[${timestamp}] ${level}: Message: ${message} Context: ${context} Stack: ${stack || ''}`),
);

export const loggerConfig: LoggerOptions = {
  level: 'info',
  transports: [
    // Konsol için renkli format
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Sadece konsola renk ekler
        commonFormat
      ),
    }),
    // Dosya logları için renksiz format
    new winston.transports.File({ format: commonFormat, filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ format: commonFormat, filename: 'logs/combined.log' }),
  ],
  exitOnError: false,
};
