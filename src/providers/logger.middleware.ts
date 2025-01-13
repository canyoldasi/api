import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Logger Middleware: ' + req.originalUrl);

    next();
  }
}
