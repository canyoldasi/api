import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
        const requestId = uuidv4();
        req.requestId = requestId;
        res.setHeader('X-Request-Id', requestId);
        next();
    }
}
