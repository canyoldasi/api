import { Catch, HttpException } from '@nestjs/common';

@Catch()
export class CustomExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException ? exception.getStatus(): 500;
    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: exception.message,
        stack: exception.stack
      });

  }
}
