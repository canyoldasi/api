import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';

@Catch()
export class CustomExceptionFilter implements GqlExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const gqlContext = host.getType<GqlContextType>() === 'graphql';

    if (gqlContext) {
      const ctx = host.getArgs(); // GraphQL'deki argümanları alır
      const status = exception instanceof HttpException ? exception.getStatus() : 500;

      return {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: ctx[3]?.req?.url || '', // Path'i almak için context'teki request'e erişim
        message: exception.message,
        stack: exception.stack,
      };
    } else {
      // HTTP için davranışı burada belirtebilirsiniz
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();

      const status = exception instanceof HttpException ? exception.getStatus() : 500;
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message,
        stack: exception.stack,
      });
    }
  }
}
