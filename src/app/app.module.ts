import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatController } from 'src/cat/cat.controller';
import { CatsService } from 'src/cat/cat.service';
import { CatModule } from 'src/cat/cat.module';
import { LoggerMiddleware } from 'src/provider/logger.middleware';

@Module({
  imports: [CatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(LoggerMiddleware)
    .forRoutes('cats')
  }
}
