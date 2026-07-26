import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { COOKIE_KEY_UV_ID } from 'src/app/config/common.constant';
import { AuthService } from 'src/app/services/auth.service';
import { SsrCookieService } from 'src/app/services/ssr-cookie.service';

export const apiRequestInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const cookieService = inject(SsrCookieService);
  const headers: Record<string, string> = {};
  const token = authService.getToken();
  const faId = cookieService.get(COOKIE_KEY_UV_ID);

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (faId) {
    headers['Faid'] = faId;
  }

  req = req.clone({
    setHeaders: headers
  });

  return next(req).pipe(catchError((err) => throwError(() => err)));
};
