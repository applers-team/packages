import { decode } from 'jsonwebtoken';
import { TokenPayload } from '../magic-link/types';
import { FullAuthMagicLinkConfig } from '../types';
import { Request } from 'express';
import { AuthMagicLinkUtil } from '../magic-link/export.types';

type RequestAuthInfo = {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
};

export function extractAuthInfoFromRequest(
  req: Request,
  config: FullAuthMagicLinkConfig,
): RequestAuthInfo {
  const accessToken = req.cookies[config.accessToken.cookieKey];
  const refreshToken = req.cookies[config.refreshToken.cookieKey];

  const userId =
    (decode(accessToken) as unknown as TokenPayload)?.userId ??
    (decode(refreshToken) as unknown as TokenPayload)?.userId;

  return {
    userId,
    accessToken,
    refreshToken,
  };
}

export async function attachUserToRequest(
  req: Request,
  userId: string,
  config: FullAuthMagicLinkConfig,
  util: AuthMagicLinkUtil,
) {
  req.userId = userId;

  switch (config.attachToRequest) {
    case 'userId': {
      req.user = { id: userId };
      return;
    }
    case 'userObject': {
      req.user = await util.getUserById(userId);
      return;
    }
    default: {
      return;
    }
  }
}
