import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-magic-link';
import { AuthMagicLinkUtil } from './export.types';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { MagicLinkUser } from './types';
import { FullAuthMagicLinkConfig } from '../types';

// this strategy is executed when calling the "VerifyMagicLinkGuard"
@Injectable()
export class MagicLinkStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
  ) {
    const { magicLinkToken } = config;
    super(
      {
        secret: magicLinkToken.secret,
        userFields: ['email'],
        tokenField: 'token',
        ttl: magicLinkToken.ttl,
      },
      async (user: MagicLinkUser, token: string): Promise<void> => {
        this.util.sendMagicLink(token, user.email);
      },
      // this is the first function which is executed
      // the return value is provided to the function above
      (user: MagicLinkUser): MagicLinkUser => {
        return { ...user, email: user.email.toLowerCase() };
      },
    );
  }
}
