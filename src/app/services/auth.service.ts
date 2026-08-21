import { Injectable } from '@angular/core';
import { environment } from 'env/environment';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserSource } from 'src/app/enums/user';
import { ApiUrl } from '../config/api-url';
import { COOKIE_KEY_USER_ID, COOKIE_KEY_USER_NAME, COOKIE_KEY_USER_TOKEN } from '../config/common.constant';
import { ResponseCode } from '../config/response-code.enum';
import { SigninDto, SigninResponse, SignupDto } from '../interfaces/auth';
import { HttpResponseEntity } from '../interfaces/http-response';
import { OptionEntity } from '../interfaces/option';
import { UserModel } from '../interfaces/user';
import { format, generateId } from '../utils/helper';
import { ApiService } from './api.service';
import { SsrCookieService } from './ssr-cookie.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly cookieService: SsrCookieService
  ) {}

  signin(payload: SigninDto): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.AUTH_SIGNIN, payload, true).pipe(
      map((res) => res || {}),
      tap((res) => {
        if (res.data?.token?.token) {
          this.setAuth(res.data);
        }
      })
    );
  }

  signout(): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_SIGNOUT,
        {
          referer: location.href
        },
        false
      )
      .pipe(
        tap((res) => {
          if (res.code === ResponseCode.SUCCESS) {
            this.clearAuth();
          }
        })
      );
  }

  signup(payload: SignupDto): Observable<UserModel> {
    return this.apiService.httpPost(ApiUrl.AUTH_SIGNUP, payload, true).pipe(map((res) => res?.data || {}));
  }

  verify(id: string, code: string): Observable<SigninResponse> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_VERIFY,
        {
          id,
          code
        },
        true
      )
      .pipe(
        map((res) => res?.data || {}),
        tap((res) => {
          if (res.token?.token) {
            this.setAuth(res);
          }
        })
      );
  }

  sendCode(payload: { id?: string; email?: string }): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.AUTH_SEND_CODE, payload, true).pipe(map((res) => res || {}));
  }

  oauthSignin(authCode: string, source: UserSource): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.AUTH_OAUTH,
        {
          authCode,
          source
        },
        false
      )
      .pipe(
        map((res) => res || {}),
        tap((res) => {
          if (res.data?.token?.token) {
            this.setAuth(res.data);
          }
        })
      );
  }

  resetPassword(payload: { email: string; code: string; password: string }): Observable<SigninResponse> {
    return this.apiService.httpPost(ApiUrl.AUTH_RESET_PASSWORD, payload, true).pipe(map((res) => res?.data || {}));
  }

  getToken(): string {
    return this.cookieService.get(COOKIE_KEY_USER_TOKEN);
  }

  setAuth(authInfo: SigninResponse) {
    const { user, token } = authInfo;
    const options = {
      path: '/',
      domain: environment.cookie.domain,
      expires: environment.cookie.expires
    };

    this.cookieService.set(COOKIE_KEY_USER_ID, user.userId, options);
    this.cookieService.set(COOKIE_KEY_USER_NAME, user.nickname, options);
    this.cookieService.set(COOKIE_KEY_USER_TOKEN, token.token, options);
  }

  clearAuth() {
    this.cookieService.delete(COOKIE_KEY_USER_TOKEN);
  }

  getOauthURL(param: {
    source: UserSource;
    ref: string;
    options: OptionEntity;
    callbackUrl: string;
    isMobile: boolean;
  }) {
    const { source, ref, options, callbackUrl, isMobile } = param;
    const oauthApi = new Map<UserSource, string>([
      [
        UserSource.ALIPAY,
        'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=$0&scope=auth_user&redirect_uri=$1&state=$2'
      ],
      [
        UserSource.WEIBO,
        'https://api.weibo.com/oauth2/authorize?client_id=$0&response_type=code&redirect_uri=$1&state=$2'
      ],
      [UserSource.GITHUB, 'https://github.com/login/oauth/authorize?client_id=$0&redirect_uri=$1&state=$2'],
      [UserSource.WECHAT, ''],
      [UserSource.QQ, '']
    ]);
    let url = '';

    switch (source) {
      case UserSource.ALIPAY:
        if (isMobile) {
          const authUrl = format(
            oauthApi.get(source)!,
            options['open_alipay_app_id'],
            encodeURIComponent(this.getOauthCallbackURL(UserSource.ALIPAY_MOBILE, ref, callbackUrl)),
            this.generateState(ref)
          );
          url = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(authUrl)}`;
        } else {
          url = format(
            oauthApi.get(source)!,
            options['open_alipay_app_id'],
            encodeURIComponent(this.getOauthCallbackURL(UserSource.ALIPAY, ref, callbackUrl)),
            this.generateState(ref)
          );
        }
        break;
      case UserSource.WEIBO:
        url = format(
          oauthApi.get(source)!,
          options['open_weibo_app_key'],
          encodeURIComponent(this.getOauthCallbackURL(UserSource.WEIBO, ref, callbackUrl)),
          this.generateState(ref)
        );
        break;
      case UserSource.GITHUB:
        url = format(
          oauthApi.get(source)!,
          options['open_github_client_id'],
          encodeURIComponent(this.getOauthCallbackURL(UserSource.GITHUB, ref, callbackUrl)),
          this.generateState(ref)
        );
    }

    return url;
  }

  getOauthCallbackURL(source: UserSource, ref: string, callbackUrl: string) {
    callbackUrl = callbackUrl.replace('{from}', source + '');

    if (source === UserSource.GITHUB) {
      return callbackUrl.replace('{ref}', '');
    }
    return callbackUrl.replace('{ref}', encodeURIComponent(ref));
  }

  generateState(ref: string) {
    const stateData = {
      ref: ref ? encodeURIComponent(ref) : '',
      stateId: generateId()
    };

    return btoa(JSON.stringify(stateData));
  }
}
