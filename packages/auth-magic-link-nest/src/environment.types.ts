import { RouteInfo } from '@nestjs/common/interfaces';
import { RequestMethod } from '@nestjs/common';

interface TokenConfig {
  secret: string;
  // seconds
  ttl: number;
}

interface OAuthTokenConfig {
  cookieKey?: string;
  config: TokenConfig;
}

export interface AuthMagicLinkPathsConfig {
  magicLink: {
    request: string;
    validate: string;
    logout: string;
  };
  auth?: {
    exclude: (string | RouteInfo)[];
  };
}

// somehow we need to state methods via this const/enum
export const ExcludedRouteMethod = RequestMethod;

export interface AuthMagicLinkConfig {
  paths: AuthMagicLinkPathsConfig;
  redirectUrl: string;
  httpsOnly: boolean;
  magicLinkToken: TokenConfig;
  accessToken: OAuthTokenConfig;
  refreshToken: OAuthTokenConfig;
  jwtOptions: {
    issuer: string;
  };
  attachToRequest: 'userObject' | 'userId';
}

export interface WithAuthMagicLinkConfig {
  authMagicLink: AuthMagicLinkConfig;
}
