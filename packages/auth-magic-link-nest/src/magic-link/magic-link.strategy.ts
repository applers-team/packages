import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-magic-link';
import { AuthMagicLinkUtil, MagicLinkUser } from './export.types';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { FullAuthMagicLinkConfig } from '../types';
import URI from 'urijs';
import { DefaultCallbackUrl } from '../constants';

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
        userFields: ['email', 'callbackUrl'],
        tokenField: 'token',
        ttl: magicLinkToken.ttl,
      },
      async (user: MagicLinkUser, token: string): Promise<void> => {
        this.util.sendMagicLink(
          user,
          (frontendUrl) =>
            URI(frontendUrl)
              .segment([
                this.config.paths.proxy ?? '',
                this.config.paths.magicLink.validate,
              ])
              .query({
                token,
                ...(user.callbackUrl &&
                  user.callbackUrl !== DefaultCallbackUrl && {
                    callbackUrl: user.callbackUrl,
                  }),
              })
              .toString(),
          token,
        );
      },
      // this is the first function which is executed
      // the return value is provided to the function above
      (user: MagicLinkUser): MagicLinkUser => {
        return { ...user, email: user.email.toLowerCase() };
      },
    );
  }
}
