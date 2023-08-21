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

const RefreshTokenValidationGracePeriodInSeconds = 5;
const ClearRefreshTokenValidationInSeconds = 60;

interface OngoingValidation {
  timestamp: Date;
  isValid: Promise<boolean>;
}

interface OngoingValidations {
  [refreshToken: string]: OngoingValidation;
}

// FIXME improve this
const ongoingValidations: OngoingValidations = {};

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(
    @InjectAuthMagicLinkConfig() private config: FullAuthMagicLinkConfig,
    @InjectAuthMagicLinkUtil() private util: AuthMagicLinkUtil,
    private readonly cookieTokenService: CookieTokenService,
  ) {}

  private refreshTokenValidationInGracePeriod(refreshToken: string) {
    return (
      new Date().getTime() -
        ongoingValidations[refreshToken].timestamp.getTime() <
      RefreshTokenValidationGracePeriodInSeconds * 1000
    );
  }

  // WARNING: we are NOT checking if the user exists
  /*
  1. check if userId and (accessToken OR refreshToken) available
    1.a yes => continue with 2
    1.b no => abort
  2. validate access token
    2.a yes
      2.a.1 extract user and append to request
      2.a.2 resolve middleware
    2.b no => continue with 3
  3. refresh token available
    3.a yes => continue with 4
    3.b no => abort
  4. check if refresh token validation ongoing (multiple requests in parallel supported)
    4.a yes => continue with 5
    4.b no
      4.b.1 add new validation to "ongoingValidations" with current timestamp as a promise
            we will not wait for the process to finish
            instead we will continue with 5
      ==> async validation steps
      4.b.2 validate refresh token (also check if it is a whitelisted)
      4.b.3 issue new access token
      4.b.4 issue new refresh token
      4.b.5 add new Refresh token to whitelist in user
      4.b.6 send to user by appending "set-cookies" to Response
      4.b.7 remove old Refresh token from whitelist in user
      4.b.8 remove this validation from memory after "ClearRefreshTokenValidationInSeconds"
  5. refresh token we want to use was about to be validated or we spawned a new validation (4)
    5.1 refresh token still in grace period
      5.1.a yes => continue with 5.2
      5.1.b no => abort
    5.2 validation we waited for returns true
      5.2.a yes => continue with 5.3
      5.2.b no => abort
    5.3 extract user and append to request
    5.4 resolve middleware

    abort process:
    remove refresh token from user from whitelist
    unset all auth cookies
    abort execution and return "Forbidden"
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const accessToken = req.cookies[this.config.accessToken.cookieKey];
    const refreshToken = req.cookies[this.config.refreshToken.cookieKey];

    const userId =
      (decode(accessToken) as unknown as TokenPayload)?.userId ??
      (decode(refreshToken) as unknown as TokenPayload)?.userId;

    // 1. check if userId and (accessToken OR refreshToken) available
    //   1.a yes => continue with 2
    //   1.b no => abort
    if (!(userId && (accessToken || refreshToken))) {
      return this.abortRequest(res, userId, refreshToken);
    }

    /*
    2. validate access token
        2.a yes
          2.a.1 extract user and append to request
          2.a.2 resolve middleware
        2.b no => continue with 3
    */
    try {
      await this.validateAccessToken(accessToken);
      await this.attachUserToRequest(req, userId);

      return next();
    } catch {
      /*
      3. refresh token available
        3.a yes => continue with 4
        3.b no => abort
      */
      if (!refreshToken) {
        return this.abortRequest(res, userId, refreshToken);
      }

      /*
      4. check if refresh token validation ongoing (multiple requests in parallel supported)
        4.a yes => continue with 5
        4.b no
          4.b.1 add new validation to "ongoingValidations" with current timestamp as a promise
                we will not wait for the process to finish
                instead we will continue with 5
          ==> async validation steps
          4.b.2 validate refresh token (also check if it is a whitelisted)
          4.b.3 issue new access token
          4.b.4 issue new refresh token
          4.b.5 add new Refresh token to whitelist in user
          4.b.6 send to user by appending "set-cookies" to Response
          4.b.7 remove old Refresh token from whitelist in user
          4.b.8 remove this validation from memory after "ClearRefreshTokenValidationInSeconds"
      */
      if (!ongoingValidations[refreshToken]) {
        ongoingValidations[refreshToken] = {
          timestamp: new Date(),
          isValid: new Promise<boolean>(async (resolve, reject) => {
            try {
              await this.validateRefreshToken(refreshToken);
              await this.cookieTokenService.prepareResponseWithNewTokens(
                res,
                userId,
              );

              await this.util.revokeRefreshTokenFrom(
                userId,
                this.cookieTokenService.hashToken(refreshToken),
              );

              return resolve(true);
            } catch (e) {
              return resolve(false);
            }
          }).then((validationResult) => {
            // FIXME improve this
            setTimeout(() => {
              delete ongoingValidations[refreshToken];
            }, ClearRefreshTokenValidationInSeconds * 1000);
            return validationResult;
          }),
        };
      }

      /*
      5. refresh token we want to use was about to be validated or we spawned a new validation (4)
        5.1 refresh token still in grace period
          5.1.a yes => continue with 5.2
          5.1.b no => abort
        5.2 validation we waited for returns true
          5.2.a yes => continue with 5.3
          5.2.b no => abort
        5.3 extract user and append to request
        5.4 resolve middleware
      */
      if (
        this.refreshTokenValidationInGracePeriod(refreshToken) &&
        (await ongoingValidations[refreshToken].isValid)
      ) {
        await this.attachUserToRequest(req, userId);

        return next();
      } else {
        return this.abortRequest(res, userId, refreshToken);
      }
    }
  }

  /*
  abort process:
    remove refresh token from user from whitelist
    unset all auth cookies
    abort execution and return "Forbidden"
  */
  private async abortRequest(
    res: Response,
    userId?: string,
    refreshToken?: string,
  ) {
    if (userId && refreshToken) {
      await this.util.revokeRefreshTokenFrom(
        userId,
        this.cookieTokenService.hashToken(refreshToken),
      );
    }
    if (refreshToken) {
      delete ongoingValidations[refreshToken];
    }

    await this.cookieTokenService.prepareResponseForClearingTokens(res);

    res.status(HttpStatus.FORBIDDEN).send(ReasonPhrases.FORBIDDEN);
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
    if (refreshToken) {
      const tokenPayload = verify(refreshToken, secret, {
        issuer,
        // FIXME
      }) as unknown as TokenPayload;

      if (
        !(await this.util.isRefreshTokenActive(
          tokenPayload.userId,
          this.cookieTokenService.hashToken(refreshToken),
        ))
      ) {
        throw new Error('Refresh Token not valid in user whitelist');
      }

      return tokenPayload;
    } else {
      throw new Error('Refresh Token not passed to validation');
    }
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
