import map from 'lodash/map';
import merge from 'lodash/merge';
import values from 'lodash/values';
import { UnionToIntersection, ValueOf } from 'ts-essentials';
import { EnvironmentMode, Profile, ProfileConfig, ProfileConfigMember, ProfileConfigMemberParameters } from './types';

export function createProfileConfigMember<E>(
  handler: ProfileConfigMember<E>,
): ProfileConfigMember<E> {
  return (params: ProfileConfigMemberParameters) => handler(params);
}

export type EvaluateFnEnv<
  EnvParts,
  FnEnv extends Record<string, ProfileConfigMember<EnvParts>>,
> = {
  [FnName in keyof FnEnv]: ReturnType<FnEnv[FnName]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Envify<EvaluatedFnEnv extends Record<string, any>> =
  UnionToIntersection<ValueOf<EvaluatedFnEnv>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupposedEnv<EnvParts, FnEnv extends Record<string, any>> = Envify<
  EvaluateFnEnv<EnvParts, FnEnv>
>;

export function createProfileConfig<
  EnvParts,
  FnEnv extends Record<string, ProfileConfigMember<EnvParts>>,
>(
  profile: Profile,
  config: FnEnv,
): ProfileConfig<SupposedEnv<EnvParts, FnEnv>> {
  return {
    name: profile,
    [EnvironmentMode.development]: transformToEnv(
      config,
      profile,
      EnvironmentMode.development,
    ),
    [EnvironmentMode.staging]: transformToEnv(
      config,
      profile,
      EnvironmentMode.staging,
    ),
    [EnvironmentMode.production]: transformToEnv(
      config,
      profile,
      EnvironmentMode.production,
    ),
  };
}

function transformToEnv<
  EnvParts,
  FnEnv extends Record<string, ProfileConfigMember<EnvParts>>,
>(
  config: FnEnv,
  profile: Profile,
  environmentMode: EnvironmentMode,
): SupposedEnv<EnvParts, FnEnv> {
  const configMembers = values(config);
  const evaluatedConfigMembers = map(configMembers, (configMember) =>
    configMember({ environmentMode, profile }),
  );
  const supposedEnv = merge(
    // Hack: we are not able to define what kind of tuples `...evaluatedConfigMembers` can be
    ...(evaluatedConfigMembers as [typeof evaluatedConfigMembers[0]]),
  );
  return supposedEnv;
}

export function ensureProfileConfig<RealEnv>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  profileConfig: ProfileConfig<RealEnv>,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
