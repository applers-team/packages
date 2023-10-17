export enum EnvironmentMode {
  development = 'development',
  staging = 'staging',
  production = 'production',
}

export enum Profile {
  foo = 'foo',
  moo = 'moo',
}

export type ProfileConfig<Environment> = Record<
  EnvironmentMode,
  Environment
  > & {
  name: Profile;
  local?: Environment;
};

export type ProfileConfigMemberParameters = {
  profile: Profile;
  environmentMode: EnvironmentMode;
};

export type ProfileConfigMember<E> = (
  params: ProfileConfigMemberParameters,
) => E;

export type Env =
  | EnvironmentMode.development
  | EnvironmentMode.staging
  | EnvironmentMode.production
  | 'local';
