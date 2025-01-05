import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomLoggerMiddleware {
  use(req, res, next) {
    console.log('Logger Middleware: ' + req.originalUrl);

    next();
  }
}
