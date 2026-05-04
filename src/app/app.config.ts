import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
    provideEnvironmentNgxMask(),
    { provide: LOCALE_ID, useValue: 'vi-VN' },
  ],
};
