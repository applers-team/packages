import { DeepRequired, Merge } from 'ts-essentials';
import {
  AuthMagicLinkConfig,
  AuthMagicLinkFrontendUrlsConfig,
  AuthMagicLinkPathsConfig,
} from './environment.types';

export type FullAuthMagicLinkConfig = Merge<
  DeepRequired<Omit<AuthMagicLinkConfig, 'paths' | 'frontendUrls'>>,
  {
    paths: AuthMagicLinkPathsConfig;
    frontendUrls: AuthMagicLinkFrontendUrlsConfig;
  }
>;
