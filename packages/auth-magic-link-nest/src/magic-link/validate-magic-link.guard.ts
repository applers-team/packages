import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { strategyNames } from '../constants';
import { InjectAuthMagicLinkConfig } from '../module.util';
import { FullAuthMagicLinkConfig } from '../types';

@Injectable()
export class ValidateMagicLinkGuard extends AuthGuard(strategyNames.magicLink) {
  constructor(@InjectAuthMagicLinkConfig() config: FullAuthMagicLinkConfig) {
    super({
      action: 'acceptToken',
      allowReuse: config.allowReuseOfMagicLink,
    });
  }
}
