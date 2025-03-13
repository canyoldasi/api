import { Catch, ArgumentsHost, HttpException, ExceptionFilter, Inject } from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { AdminNotificationHelper } from './admin-notification.helper';
import { FastifyReply } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements GqlExceptionFilter, ExceptionFilter {
    constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger) {}

    catch(exception: any, host: ArgumentsHost) {
        const isGraphQL = host.getType<GqlContextType>() === 'graphql';
        const context = isGraphQL ? host.getArgs()[2] : host.switchToHttp().getRequest();
        const requestId = context?.requestId || 'unknown'; // requestId'yi al

        if (isGraphQL) {
            return this.handleGraphQLException(exception, requestId);
        } else {
            return this.handleHTTPException(exception, host, requestId);
        }
    }

    private handleGraphQLException(exception: any, requestId: string) {
        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const message = exception.message || 'Internal server error';

        this.logger.error(`Status: ${status} Message: ${message}`, exception.stack, requestId);

        if (exception.notify) {
            if (process.env.NODE_ENV == 'production') {
                const emailHelper = new AdminNotificationHelper();
                emailHelper.sendEmail(`
          Status: ${status}
          Message: ${message}
          Request ID: ${requestId}
          Stack: ${exception.stack}`);
            }
        }
        return new ApolloError(`${exception.name}: ${message}`, status.toString(), {
            message,
            stack: process.env.NODE_ENV == 'development' ? exception.stack : null,
        });
    }

    private handleHTTPException(exception: any, host: ArgumentsHost, requestId: string) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest();

        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const message = exception?.message || 'Internal server error';

        this.logger.error(`Status: ${status} Message: ${message}`, exception.stack, requestId);

        if (exception.notify) {
            if (process.env.NODE_ENV == 'production') {
                const emailHelper = new AdminNotificationHelper();
                emailHelper.sendEmail(`
          Status: ${status}
          Message: ${message}
          Request ID: ${requestId}
          Stack: ${exception.stack}`);
            }
        }

        return response.status(status).send({
            requestId: requestId,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
            stack: process.env.NODE_ENV == 'development' ? exception.stack : null,
        });
    }
}
