import { Env, EnvironmentMode, Profile, ProfileConfig } from './types';

export function selectEnvironment<Environment>(
  configs: Record<Profile, ProfileConfig<Environment>>,
  profile: Profile = Profile.moo,
  env: Env = EnvironmentMode.development,
): Environment {
  env = env || EnvironmentMode.development; // react-env returns an empty string if an env variable is not available
  profile = profile || Profile.moo; // therefore, we enforce a default value with the '||' operator.
  const wrongAssignment = Object.keys(configs).find(
    (profileKey) => configs[profileKey as Profile].name !== profileKey,
  ) as Profile | undefined;
  if (wrongAssignment) {
    throw new Error(
      `Wrongly assigned profile "${configs[wrongAssignment].name}" to "${wrongAssignment}"`,
    );
  }
  if (!profile) {
    throw new Error(
      'No profile specified via "CCA_PROFILE" environment variable',
    );
  }
  if (!configs[profile]?.[env]) {
    throw new Error(
      `Environment "${env}" for profile "${profile}" can not be loaded`,
    );
  }
  return configs[profile][env] as Environment;
}
