import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { ExecutionTimeInterceptor } from './providers/execution-time.intercepter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ExecutionTimeInterceptor())
  await app.listen(process.env.APP_PORT);
}
bootstrap();

