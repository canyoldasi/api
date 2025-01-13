import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { CustomExceptionFilter } from './providers/custom.exception-filter';
import { ExecutionTimeInterceptor } from './providers/execution-time.intercepter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new CustomExceptionFilter())
  app.useGlobalInterceptors(new ExecutionTimeInterceptor)
  await app.listen(process.env.APP_PORT);
}
bootstrap();

