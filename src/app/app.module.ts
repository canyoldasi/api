import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from 'src/cat/cat.module';
import { CustomLoggerMiddleware } from 'src/providers/custom.logger.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/providers/jwt.strategy';

@Module({
  imports: [
    CatModule, 
    AuthModule,
    PassportModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'canyoldasi',
      synchronize: true,
      autoLoadEntities: true
    }),
    JwtModule.register({
      secret: '1',
      signOptions: {
        expiresIn: '9999h'
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(CustomLoggerMiddleware)
    .forRoutes('cats')
  }
}