import {
  Controller,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CookieTokenService } from '../auth/cookie-token.service';
import { RequestMagicLinkGuard } from './request-magic-link.guard';
import { ValidateMagicLinkGuard } from './validate-magic-link.guard';
import { ExtractEmailFromMagicLink } from './extract-email-from-magic-link.decorator';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { AuthMagicLinkUtil } from './export.types';
import { FullAuthMagicLinkConfig } from '../types';
import { MagicLinkValidationFailure } from '../auth/exception.middleware';

@Controller()
export class LoginController {
  constructor(
    private readonly cookieTokenService: CookieTokenService,
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
  ) {}

  @UseGuards(RequestMagicLinkGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  requestMagicLink() {}

  @UseGuards(ValidateMagicLinkGuard)
  @UseFilters(MagicLinkValidationFailure)
  async validate(
    @Res({ passthrough: true }) response: Response,
    @ExtractEmailFromMagicLink() email: string,
    @Query('callbackUrl') callbackUrl: string,
  ) {
    const { frontendUrls } = this.config;

    const { userId } = await this.util.findOrCreateByEmail({ email });
    console.log(callbackUrl);

    await this.cookieTokenService.prepareResponseWithNewTokens(
      response,
      userId,
    );

    if (callbackUrl !== 'default') {
      response.redirect(callbackUrl);
    } else {
      response.redirect(frontendUrls.auth.redirect.success);
    }
    return;
  }

  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.cookieTokenService.removeCookies(response);
    await this.util.revokeRefreshTokenFrom(
      req.userId,
      this.cookieTokenService.hashToken(
        req.cookies[this.config.refreshToken.cookieKey],
      ),
    );
  }
}
