import { Injectable } from '@nestjs/common';
import { AuthMagicLinkUtil } from '../magic-link/export.types';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions } from 'express-serve-static-core';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { Response } from 'express';
import { FullAuthMagicLinkConfig } from '../types';
import { createHash } from 'crypto';

export interface TokenGenerationResponse {
  value: string;
  cookieOptions: CookieOptions;
}

@Injectable()
export class CookieTokenService {
  private readonly defaultCookieOptions: CookieOptions;

  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
    private readonly jwtService: JwtService,
  ) {
    const { httpsOnly } = config;
    this.defaultCookieOptions = {
      httpOnly: true,
      secure: httpsOnly,
      sameSite: 'strict',
      path: '/',
    };
  }

  hashToken(token: string): string {
    return createHash('sha3-256').update(token).digest('base64');
  }

  async prepareResponseForClearingTokens(response: Response) {
    response.clearCookie(this.config.accessToken.cookieKey);
    response.clearCookie(this.config.refreshToken.cookieKey);
  }

  async prepareResponseWithNewTokens(response: Response, userId: string) {
    const accessTokenCookie = await this.newAccessTokenFor(userId);
    response.cookie(
      this.config.accessToken.cookieKey,
      accessTokenCookie.value,
      accessTokenCookie.cookieOptions,
    );

    const refreshTokenCookie = await this.newRefreshTokenFor(userId);
    response.cookie(
      this.config.refreshToken.cookieKey,
      refreshTokenCookie.value,
      refreshTokenCookie.cookieOptions,
    );
  }

  removeCookies(response: Response) {
    response.clearCookie(this.config.accessToken.cookieKey);
    response.clearCookie(this.config.refreshToken.cookieKey);
  }

  private async newAccessTokenFor(
    userId: string,
  ): Promise<TokenGenerationResponse> {
    const {
      accessToken: {
        config: { secret, ttl },
      },
      jwtOptions,
    } = this.config;

    const token = this.jwtService.sign(
      { userId },
      {
        secret,
        expiresIn: ttl,
        ...jwtOptions,
      },
    );

    return {
      value: token,
      cookieOptions: {
        ...this.defaultCookieOptions,
        // max age in ms
        maxAge: ttl * 1000,
      },
    };
  }

  private async newRefreshTokenFor(
    userId: string,
  ): Promise<TokenGenerationResponse> {
    const {
      refreshToken: {
        config: { secret, ttl },
      },
      jwtOptions,
    } = this.config;

    const token = this.jwtService.sign(
      { userId },
      {
        secret,
        expiresIn: ttl,
        ...jwtOptions,
      },
    );

    await this.util.addActiveRefreshTokenTo(userId, this.hashToken(token));

    return {
      value: token,
      cookieOptions: {
        ...this.defaultCookieOptions,
        // max age in ms
        maxAge: ttl * 1000,
      },
    };
  }
}
