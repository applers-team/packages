import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { MagicLinkUser } from './export.types';

export const ExtractEmailFromMagicLink = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return (request.user as MagicLinkUser).email;
  },
);
