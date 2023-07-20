import { makeInjectableDecorator } from '@golevelup/nestjs-common';

export const AuthMagicLinkOptionsInjectionToken = Symbol(
  'AuthMagicLinkOptionsInjectionToken',
);
export const AuthMagicLinkUtilInjectionToken = Symbol(
  'AuthMagicLinkUtilInjectionToken',
);
export const AuthMagicLinkConfigInjectionToken = Symbol(
  'AuthMagicLinkUtilInjectionToken',
);

export const InjectAuthMagicLinkUtil = makeInjectableDecorator(
  AuthMagicLinkUtilInjectionToken,
);

export const InjectAuthMagicLinkConfig = makeInjectableDecorator(
  AuthMagicLinkConfigInjectionToken,
);
