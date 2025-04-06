import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as fs from 'fs';

async function bootstrap() {
    const fastifyAdapter = new FastifyAdapter({
        bodyLimit: 50048576,
        ...(process.env.HTTPS === 'true' && {
            https: {
                cert: fs.readFileSync(process.env.HTTPS_CERT_FILE, 'utf-8'),
                key: fs.readFileSync(process.env.HTTPS_KEY_FILE, 'utf-8'),
            },
        }),
    });

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter);

    // CORS ayarları
    app.enableCors({
        origin: process.env.NODE_ENV === 'development' ? '*' : process.env.CORS_ALLOWED_ORIGINS?.split(','),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    await app.listen(process.env.APP_PORT, '0.0.0.0');
}
bootstrap();
