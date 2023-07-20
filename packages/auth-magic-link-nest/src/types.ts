import { DeepRequired, Merge } from 'ts-essentials';
import {
  AuthMagicLinkConfig,
  AuthMagicLinkPathsConfig,
} from './environment.types';

export type FullAuthMagicLinkConfig = Merge<
  DeepRequired<Omit<AuthMagicLinkConfig, 'paths'>>,
  { paths: AuthMagicLinkPathsConfig }
>;
