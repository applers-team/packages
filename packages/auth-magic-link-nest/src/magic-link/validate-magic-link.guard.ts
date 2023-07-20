import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { strategyNames } from '../constants';

@Injectable()
export class ValidateMagicLinkGuard extends AuthGuard(strategyNames.magicLink) {
  constructor() {
    super({
      action: 'acceptToken',
      // any other options can be provided here
      allowReuse: false,
    });
  }
}
