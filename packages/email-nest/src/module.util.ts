import { EmailConfig } from './environment.types';
import { makeInjectableDecorator } from '@golevelup/nestjs-common';

export interface EmailModuleOptions {
  config: EmailConfig;
}

export const EmailModuleOptionsInjectionToken = Symbol(
  'EmailModuleOptionsInjectionToken',
);
export const EmailModuleConfigInjectionToken = Symbol(
  'EmailModuleConfigInjectionToken',
);

export const InjectEmailConfig = makeInjectableDecorator(
  EmailModuleConfigInjectionToken,
);
