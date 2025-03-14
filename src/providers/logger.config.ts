import { LoggerOptions } from 'winston';
import * as winston from 'winston';
import * as moment from 'moment-timezone';

// Geçerli log seviyeleri
const validLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

// Environment'tan log seviyesini al, geçerli değilse 'info' kullan
const logLevel = validLogLevels.includes(process.env.LOG_LEVEL?.toLowerCase())
    ? process.env.LOG_LEVEL.toLowerCase()
    : 'info';

const uncoloredFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss.SSS'),
    }),
    winston.format.printf(
        ({ timestamp, level, message, stack, context }) =>
            `[${timestamp}] ${level}: Message: ${message} Context: ${context} Stack: ${stack || ''}`
    )
);

export const loggerConfig: LoggerOptions = {
    level: logLevel,
    transports: [
        // Konsol için renkli format
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), uncoloredFormat),
        }),
        // Dosya logları için renksiz format
        new winston.transports.File({ format: uncoloredFormat, filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ format: uncoloredFormat, filename: 'logs/combined.log' }),
    ],
    exitOnError: false,
};
