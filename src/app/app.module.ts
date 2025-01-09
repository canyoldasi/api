import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatModule } from 'src/cat/cat.module';
import { CustomLoggerMiddleware } from 'src/providers/custom.logger.middleware';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [CatModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(CustomLoggerMiddleware)
    .forRoutes('cats')
  }
}
