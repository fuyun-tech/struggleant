import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import zh from '@angular/common/locales/zh';
import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideNzNoAnimation } from 'ng-zorro-antd/core/animation';
import { provideNzDateFnsAdapter } from 'ng-zorro-antd/core/time';
import { provideNzI18n, zh_CN } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { routes } from './app.routes';
import { icons } from './config/icons.constant';
import { GlobalErrorHandler } from './core/global-error-handler';
import { apiRequestInterceptor } from './interceptors/api-request.interceptor';

registerLocaleData(zh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includePostRequests: false,
        includeRequestsWithAuthHeaders: true
      })
    ),
    provideHttpClient(withInterceptors([apiRequestInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideNzI18n(zh_CN),
    importProvidersFrom(FormsModule),
    provideNzIcons(icons),
    provideNzDateFnsAdapter(),
    provideNzNoAnimation()
  ]
};
