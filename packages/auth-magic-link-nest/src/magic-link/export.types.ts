import { AuthMagicLinkConfig } from '../environment.types';

export interface CreateUserAttributes {
  email: string;
}

export type LoginLinkGeneratorFunction = (frontendUrl: string) => string;

export interface AuthMagicLinkUtil<DBUser = any> {
  findOrCreateByEmail: (
    attributes: CreateUserAttributes,
  ) => Promise<{ userId: string }>;
  getUserIdByEmail: (email: string) => Promise<string>;
  getUserById: (userId: string) => Promise<DBUser>;
  isRefreshTokenActive: (
    userId: string,
    refreshTokenHash: string,
  ) => boolean | Promise<boolean>;
  addActiveRefreshTokenTo: (
    userId: string,
    refreshTokenHash: string,
  ) => void | Promise<void>;
  revokeRefreshTokenFrom: (
    userId: string,
    refreshTokenHash: string,
  ) => void | Promise<void>;
  sendMagicLink: (
    user: DBUser,
    loginLinkGenerator: LoginLinkGeneratorFunction,
    token: string,
  ) => void | Promise<void>;
}

export interface AuthMagicLinkModuleOptions {
  authMagicLinkUtilService: AuthMagicLinkUtil;
  config: AuthMagicLinkConfig;
}
