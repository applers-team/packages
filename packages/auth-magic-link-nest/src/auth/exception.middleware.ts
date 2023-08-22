import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  InjectAuthMagicLinkConfig,
  InjectAuthMagicLinkUtil,
} from '../module.util';
import { AuthMagicLinkUtil } from '../magic-link/export.types';
import { CookieTokenService } from './cookie-token.service';
import { FullAuthMagicLinkConfig } from '../types';
import { Response } from 'express';
import { ReasonPhrases } from 'http-status-codes';

@Catch(UnauthorizedException)
export class MagicLinkValidationFailure implements ExceptionFilter {
  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
    private readonly cookieTokenService: CookieTokenService,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    this.cookieTokenService.removeCookies(response);

    const failureRedirectPath = this.config.frontendUrls.auth.redirect.failure;
    if (failureRedirectPath) {
      response.status(status).redirect(failureRedirectPath);
    } else {
      response.status(HttpStatus.UNAUTHORIZED).send(ReasonPhrases.UNAUTHORIZED);
    }
  }
}
