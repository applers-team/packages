import {
  Get,
  MiddlewareConsumer,
  Module,
  NestModule,
  Post,
  RequestMethod,
} from '@nestjs/common';
import { MagicLinkStrategy } from './magic-link/magic-link.strategy';
import { RequestMagicLinkGuard } from './magic-link/request-magic-link.guard';
import { ValidateMagicLinkGuard } from './magic-link/validate-magic-link.guard';
import { AuthMagicLinkModuleOptions } from './magic-link/export.types';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { JwtModule } from '@nestjs/jwt';
import { CookieTokenService } from './auth/cookie-token.service';
import cookieParser from 'cookie-parser';
import { LoginController } from './magic-link/login.controller';
import { AuthenticationMiddleware } from './auth/authentication.middleware';
import {
  AuthMagicLinkConfigInjectionToken,
  AuthMagicLinkOptionsInjectionToken,
  AuthMagicLinkUtilInjectionToken,
  InjectAuthMagicLinkConfig,
} from './module.util';
import {
  DefaultAccessTokenCookieKey,
  DefaultRefreshTokenCookieKey,
} from './constants';
import { FullAuthMagicLinkConfig } from './types';
import { callbackUrlMiddleware } from './magic-link/callback-url.middleware';

@Module({
  imports: [JwtModule],
  providers: [
    MagicLinkStrategy,
    RequestMagicLinkGuard,
    ValidateMagicLinkGuard,
    AuthenticationMiddleware,
    CookieTokenService,
  ],
  controllers: [LoginController],
  exports: [RequestMagicLinkGuard, ValidateMagicLinkGuard, CookieTokenService],
})
export class AuthMagicLinkModule
  extends createConfigurableDynamicRootModule<
    AuthMagicLinkModule,
    AuthMagicLinkModuleOptions
  >(AuthMagicLinkOptionsInjectionToken, {
    providers: [
      {
        provide: AuthMagicLinkUtilInjectionToken,
        inject: [AuthMagicLinkOptionsInjectionToken],
        useFactory: (options: AuthMagicLinkModuleOptions) =>
          options.authMagicLinkUtilService,
      },
      {
        provide: AuthMagicLinkConfigInjectionToken,
        inject: [AuthMagicLinkOptionsInjectionToken],
        useFactory: (options: AuthMagicLinkModuleOptions) => {
          const config: FullAuthMagicLinkConfig = {
            ...options.config,
            allowReuseOfMagicLink: !!options.config.allowReuseOfMagicLink,
            paths: {
              ...options.config.paths,
              auth: options.config.paths.auth ?? {
                exclude: [],
              },
            },
            accessToken: {
              ...options.config.accessToken,
              cookieKey:
                options.config.accessToken.cookieKey ??
                DefaultAccessTokenCookieKey,
            },
            refreshToken: {
              ...options.config.refreshToken,
              cookieKey:
                options.config.refreshToken.cookieKey ??
                DefaultRefreshTokenCookieKey,
            },
          };

          if (
            options.config.accessToken.cookieKey &&
            options.config.refreshToken.config &&
            options.config.accessToken.cookieKey ===
              options.config.refreshToken.cookieKey
          ) {
            throw new Error(
              `the cookie key for the access and refresh token cannot be the same: "${options.config.accessToken.cookieKey}"`,
            );
          }
          return config;
        },
      },
    ],
    exports: [
      AuthMagicLinkUtilInjectionToken,
      AuthMagicLinkConfigInjectionToken,
    ],
  })
  implements NestModule
{
  static deferred = () =>
    AuthMagicLinkModule.externallyConfigured(AuthMagicLinkModule, 0);

  configure(consumer: MiddlewareConsumer) {
    const { paths } = this.config;

    // this is somewhat hacky but as long as we cannot determine
    // controllers dynamically, that is the only (best) way to go
    // https://github.com/nestjs/nest/issues/1438#issuecomment-1014946202
    Post(paths.magicLink.request)(
      LoginController,
      LoginController.prototype.requestMagicLink.name,
      Object.getOwnPropertyDescriptor(
        LoginController.prototype,
        LoginController.prototype.requestMagicLink.name,
      ) as PropertyDescriptor,
    );

    Get(paths.magicLink.validate)(
      LoginController,
      LoginController.prototype.validate.name,
      Object.getOwnPropertyDescriptor(
        LoginController.prototype,
        LoginController.prototype.validate.name,
      ) as PropertyDescriptor,
    );
    Post(paths.magicLink.logout)(
      LoginController,
      LoginController.prototype.logout.name,
      Object.getOwnPropertyDescriptor(
        LoginController.prototype,
        LoginController.prototype.logout.name,
      ) as PropertyDescriptor,
    );

    // should be ok to apply it on all routes
    // mms applied the middleware globally by using "onModuleInit"
    // and injecting the express "app" via the "HttpAdapterHost"
    consumer.apply(cookieParser()).forRoutes('*');

    consumer
      .apply(AuthenticationMiddleware)
      .exclude(
        paths.magicLink.request,
        paths.magicLink.validate,
        ...(paths.auth?.exclude ?? []),
      )
      .forRoutes('*');

    consumer.apply(callbackUrlMiddleware).forRoutes({
      path: paths.magicLink.request,
      method: RequestMethod.POST,
    });
  }

  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
  ) {
    super();
  }
}
