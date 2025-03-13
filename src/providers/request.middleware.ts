import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FastifyReply } from 'fastify';
import FastifyRequestCustom from './fastify-request-custom';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
    use(req: FastifyRequestCustom, res: FastifyReply, next: () => void) {
        const requestId = uuidv4();
        req.requestId = requestId;
        res.header('X-Request-Id', requestId);
        next();
    }
}
