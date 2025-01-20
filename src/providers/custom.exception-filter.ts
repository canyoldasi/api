import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';

@Catch()
export class CustomExceptionFilter implements GqlExceptionFilter, ExceptionFilter {
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
    
    // Detaylı stack trace ekleniyor
    const errorDetails = {
      message,
      stack: exception.stack || 'No stack trace available',
    };

    return new ApolloError(
      message,
      status.toString(),
      errorDetails
    );
  }

  private handleHTTPException(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception?.message || 'Internal server error';
    
    // Detaylı stack trace ekleniyor
    const errorDetails = {
      message,
      stack: exception.stack || 'No stack trace available',
    };

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorDetails, // stack trace ve message burada
    });
  }
}
