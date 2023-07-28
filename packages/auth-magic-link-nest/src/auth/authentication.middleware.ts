import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { decode, verify } from 'jsonwebtoken';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { AuthMagicLinkUtil } from '../magic-link/export.types';
import { ReasonPhrases } from 'http-status-codes';
import { CookieTokenService } from './cookie-token.service';
import { TokenPayload } from '../magic-link/types';
import { FullAuthMagicLinkConfig } from '../types';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
    private readonly cookieTokenService: CookieTokenService,
  ) {}

  // WARNING: we are NOT checking if the user exists
  /*
  1. validate access token
  2a. access token valid =>
    2a.1 extract user and append to Request
    2a.2 continue execution
  2b. access token invalid => validate Refresh token (also check if it is a whitelisted)
    2b.a refresh token valid =>
      2b.a.1 issue new access token
      2b.a.2 issue new refresh token
      2b.a.3 add new Refresh token to whitelist in user
      2b.a.4 send to user by appending "set-cookies" to Response
      2b.a.5 remove old Refresh token from whitelist in user
      2b.a.6 extract user and append to Request
      2b.a.7 continue execution
    2b.b refresh token invalid =>
      2b.b.1 remove refresh token from user from whitelist
      2b.b.2 unset all cookies
      2b.b.3 abort execution and return "Forbidden"
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const accessToken = req.cookies[this.config.accessToken.cookieKey];
    const refreshToken = req.cookies[this.config.refreshToken.cookieKey];

    try {
      // 1. validate access token
      const tokenPayload = await this.validateAccessToken(accessToken);
      // 2a. access token valid =>

      // 2a.1 extract user and append to Request
      await this.attachUserToRequest(req, tokenPayload.userId);

      // 2a.2 continue execution
      return next();
    } catch (e) {
      try {
        // 2b. access token invalid => validate Refresh token (also check if it is a whitelisted)
        const tokenPayload = await this.validateRefreshToken(refreshToken);
        // 2b.a refresh token valid =>

        // 2b.a.1 issue new access token
        // 2b.a.2 issue new refresh token
        // 2b.a.3 add new Refresh token to whitelist in user
        // 2b.a.4 send to user by appending "set-cookies" to Response
        await this.cookieTokenService.prepareResponseWithNewTokens(
          res,
          tokenPayload.userId,
        );

        // 2b.a.5 remove old Refresh token from whitelist in user
        await this.util.revokeRefreshTokenFrom(
          tokenPayload.userId,
          this.cookieTokenService.hashToken(refreshToken),
        );

        // 2b.a.6 extract user and append to Request
        await this.attachUserToRequest(req, tokenPayload.userId);

        // 2b.a.7 continue execution
        return next();
      } catch (e) {
        // 2b.b refresh token invalid =>
        // 2b.b.1 remove refresh token from user from whitelist
        if (refreshToken) {
          const tokenPayload = decode(refreshToken) as unknown as TokenPayload;
          if (tokenPayload?.userId) {
            await this.util.revokeRefreshTokenFrom(
              tokenPayload.userId,
              this.cookieTokenService.hashToken(refreshToken),
            );
          }
        }

        // 2b.b.2 unset all cookies
        await this.cookieTokenService.prepareResponseForClearingTokens(res);

        // 2b.b.3 abort execution and return "Forbidden"
        res.status(HttpStatus.FORBIDDEN).send(ReasonPhrases.FORBIDDEN);
        return;
      }
    }
  }

  private async validateAccessToken(
    accessToken?: string,
  ): Promise<TokenPayload> {
    const {
      accessToken: {
        config: { secret },
      },
      jwtOptions: { issuer },
    } = this.config;

    return verify(accessToken ?? '', secret, {
      issuer,
      // FIXME
    }) as unknown as TokenPayload;
  }

  private async validateRefreshToken(
    refreshToken?: string,
  ): Promise<TokenPayload> {
    const {
      refreshToken: {
        config: { secret },
      },
      jwtOptions: { issuer },
    } = this.config;

    const tokenPayload = verify(refreshToken ?? '', secret, {
      issuer,
      // FIXME
    }) as unknown as TokenPayload;

    if (
      !(await this.util.isRefreshTokenActive(
        tokenPayload.userId,
        this.cookieTokenService.hashToken(refreshToken!),
      ))
    ) {
      throw new Error('Refresh Token not valid in user whitelist');
    }

    return tokenPayload;
  }

  private async attachUserToRequest(req: Request, userId: string) {
    req.userId = userId;

    switch (this.config.attachToRequest) {
      case 'userId': {
        req.user = { id: userId };
        return;
      }
      case 'userObject': {
        req.user = await this.util.getUserById(userId);
        return;
      }
      default: {
        return;
      }
    }
  }
}
