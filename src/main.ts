import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { CustomExceptionFilter } from './providers/custom.exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //app.useGlobalFilters(new CustomExceptionFilter())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

