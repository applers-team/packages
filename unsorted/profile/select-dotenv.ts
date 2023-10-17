import { Env } from './types';

const environmentMap: { [environmentName: string]: string } = {
  development: '.env',
  staging: '.env.staging.local',
  production: '.env.production.local',
  default: '.env',
};

export function selectDotenv(environment: Env): string {
  return environmentMap[environment] || environmentMap.default;
}
