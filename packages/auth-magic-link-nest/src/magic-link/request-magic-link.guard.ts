import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { strategyNames } from '../constants';

@Injectable()
export class RequestMagicLinkGuard extends AuthGuard(strategyNames.magicLink) {
  constructor() {
    super({
      action: 'requestToken',
      // any other options can be provided here
      allowReuse: false,
    });
  }
}
