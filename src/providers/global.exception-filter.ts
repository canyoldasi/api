import { Catch, ArgumentsHost, HttpException, ExceptionFilter, Inject } from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';
import { EmailTransport } from './logger-email-transport';

@Catch()
export class GlobalExceptionFilter implements GqlExceptionFilter, ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: WinstonLogger
  )
  {

  }

  catch(exception: any, host: ArgumentsHost) {
    const isGraphQL = host.getType<GqlContextType>() === 'graphql';

    if (isGraphQL) {
      return this.handleGraphQLException(exception);
    } else {
      return this.handleHTTPException(exception, host);
    }
  }

  private handleGraphQLException(exception: any) {
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception.message || 'Internal server error';
    
    if (exception.notify) {
      const emailTransport = new EmailTransport();
      emailTransport.sendEmail(`
        Status: ${status}
        Message: ${message}
        Stack: ${exception.stack}`)
      this.logger.error(`Status: ${status} Message: ${message} Stack: ${exception.stack}`)
    }    

    return new ApolloError(message, status.toString(), { message, stack: exception.stack });
  }

  private handleHTTPException(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception?.message || 'Internal server error';
    const isBusinessLogicError = exception?.isBusinessLogicError || false;

    if (exception.notify) {
      const emailTransport = new EmailTransport();
      emailTransport.sendEmail(`
        Status: ${status}
        Message: ${message}
        Stack: ${exception.stack}`)
      this.logger.error(`Status: ${status} Message: ${message} Stack: ${exception.stack}`)
    } 

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      stack: exception.stack || 'No stack trace available',
    });
  }
}
