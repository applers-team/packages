import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { attachUserToRequest, extractAuthInfoFromRequest } from './util';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { FullAuthMagicLinkConfig } from '../types';
import { AuthMagicLinkUtil } from '../magic-link/export.types';

@Injectable()
export class WithOptionalUserGuard implements CanActivate {
  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const { userId } = extractAuthInfoFromRequest(req, this.config);

    if (userId) {
      await attachUserToRequest(req, userId, this.config, this.util);
    }

    return true;
  }
}
