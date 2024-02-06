import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class callbackUrlMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): any {
    const callbackUrl = req.query.callbackUrl;
    if (!callbackUrl) {
      req.query.callbackUrl = 'default';
    }
    next();
  }
}
