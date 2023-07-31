import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import {
  EmailModuleConfigInjectionToken,
  EmailModuleOptions,
  EmailModuleOptionsInjectionToken,
} from './module.util';

@Module({
  imports: [],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule extends createConfigurableDynamicRootModule<
  EmailModule,
  EmailModuleOptions
>(EmailModuleOptionsInjectionToken, {
  providers: [
    {
      provide: EmailModuleConfigInjectionToken,
      inject: [EmailModuleOptionsInjectionToken],
      useFactory: (options: EmailModuleOptions) => options.config,
    },
  ],
}) {
  static deferred = () => EmailModule.externallyConfigured(EmailModule, 0);
}
