import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-magic-link';
import { AuthMagicLinkUtil, UserProvidedQueryParams } from './export.types';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { FullAuthMagicLinkConfig } from '../types';
import URI from 'urijs';
import { DefaultCallbackUrl } from '../constants';

const queryParamsToExtract: Record<keyof UserProvidedQueryParams, null> = {
  email: null,
  callbackUrl: null,
};

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
        userFields: Object.keys(queryParamsToExtract),
        tokenField: 'token',
        ttl: magicLinkToken.ttl,
      },
      async (
        queryParams: UserProvidedQueryParams,
        token: string,
      ): Promise<void> => {
        this.util.sendMagicLink(
          queryParams,
          (frontendUrl) =>
            URI(frontendUrl)
              .segment([
                this.config.paths.proxy ?? '',
                this.config.paths.magicLink.validate,
              ])
              .query({
                token,
                ...(queryParams.callbackUrl &&
                  queryParams.callbackUrl !== DefaultCallbackUrl && {
                    callbackUrl: queryParams.callbackUrl,
                  }),
              })
              .toString(),
          token,
        );
      },
      // this is the first function which is executed
      // the return value is provided to the function above
      (queryParams: UserProvidedQueryParams): UserProvidedQueryParams => {
        return { ...queryParams, email: queryParams.email.toLowerCase() };
      },
    );
  }
}
