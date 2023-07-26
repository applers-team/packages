import { AuthMagicLinkConfig } from '../environment.types';

export interface CreateUserAttributes {
  email: string;
}

export interface AuthMagicLinkUtil<DBUser = any> {
  findOrCreateByEmail: (
    attributes: CreateUserAttributes,
  ) => Promise<{ userId: string }>;
  getUserIdByEmail: (email: string) => Promise<string>;
  getUserById: (userId: string) => Promise<DBUser>;
  isRefreshTokenActive: (
    userId: string,
    refreshToken: string,
  ) => boolean | Promise<boolean>;
  addActiveRefreshTokenTo: (
    userId: string,
    refreshToken: string,
  ) => void | Promise<void>;
  revokeRefreshTokenFrom: (
    userId: string,
    refreshToken: string,
  ) => void | Promise<void>;
  sendMagicLink: (token: string, user: DBUser) => void | Promise<void>;
}

export interface AuthMagicLinkModuleOptions {
  authMagicLinkUtilService: AuthMagicLinkUtil;
  config: AuthMagicLinkConfig;
}
