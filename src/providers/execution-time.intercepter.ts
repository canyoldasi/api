import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import FastifyRequestCustom from './fastify-request-custom';

@Injectable()
export class ExecutionTimeInterceptor implements NestInterceptor {
    constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<FastifyRequestCustom>();
        const requestId = request.requestId || 'unknown';

        this.logger.log(`Request started: ${request.method} ${request.url}`, requestId);

        const now = Date.now();
        return next.handle().pipe(
            tap(() => {
                const executionTime = Date.now() - now;
                this.logger.log(`Request completed in ${executionTime}ms`, requestId);
            })
        );
    }
}
