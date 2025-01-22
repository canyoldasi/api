import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../providers/jwt.strategy';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from '../user/user.module';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from 'src/providers/logger.config';
import { createLogger, transports, format, config } from 'winston';
import * as moment from 'moment-timezone';

@Module({
  imports: [
    WinstonModule.forRoot(loggerConfig),
    PassportModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: Boolean(process.env.DATABASE_SYNC),
      autoLoadEntities: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Winston logger'ı özel seviyelerle oluştur
    const logger = createLogger({
      levels: {
        ...config.npm.levels, // Varsayılan seviyeleri al
        verbose: 2, // 'log' yerine 'verbose' seviyesini ekle
      },
      format: format.combine(
        format.timestamp({
          format: () => moment().tz('Europe/Istanbul').format('YYYY-MM-DD HH:mm:ss.SSS'), // Türkiye saat dilimine göre format
        }),
        format.printf(({ level, message, timestamp }) => `${timestamp} [${level.toUpperCase()}]: ${message}`),
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'application.log' }),
      ],
    });

    (['log', 'error', 'warn', 'debug'] as const).forEach((method) => {
      //const originalMethod = console[method];
      console[method] = (...args: unknown[]) => {
        const message = args
          .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
          .join(' ');
        if (logger.levels[method] !== undefined) {
          logger.log({ level: 'info', message });
        } else {
          logger.info(message); // Eğer özel bir seviye bulunmazsa 'info' seviyesini kullan
        }
        //originalMethod.apply(console, args);
      };
    });
    console.log("deneme beni canım");
  }
}
