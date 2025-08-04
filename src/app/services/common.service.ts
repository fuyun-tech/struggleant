import { HttpStatusCode } from '@angular/common/http';
import { DOCUMENT, ElementRef, Inject, Injectable, Optional, REQUEST, RESPONSE_INIT } from '@angular/core';
import { environment } from 'env/environment';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  COOKIE_KEY_THEME,
  COOKIE_KEY_USER_ID,
  MEDIA_QUERY_THEME_DARK,
  MEDIA_QUERY_THEME_LIGHT
} from '../config/common.constant';
import { Message } from '../config/message.enum';
import { Theme } from '../enums/common';
import { PageIndexInfo } from '../interfaces/common';
import { CustomError } from '../interfaces/custom-error';
import { PlatformService } from './platform.service';
import { SsrCookieService } from './ssr-cookie.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private pageIndex: Subject<string> = new Subject<string>();
  public pageIndex$: Observable<string> = this.pageIndex.asObservable();

  private siderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public siderVisible$: Observable<boolean> = this.siderVisible.asObservable();

  private darkMode: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public darkMode$: Observable<boolean> = this.darkMode.asObservable();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Optional() @Inject(REQUEST) private readonly request: any,
    @Optional() @Inject(RESPONSE_INIT) private readonly response: any,
    private readonly platform: PlatformService,
    private readonly cookieService: SsrCookieService
  ) {}

  updatePageIndex(pageIndex: string) {
    this.pageIndex.next(pageIndex);
  }

  getPageIndexInfo(pageIndex: string): PageIndexInfo {
    const topPage = pageIndex.split('-')[0];
    const subPage = pageIndex.split('-')[1];

    return {
      isHome: pageIndex === 'index',
      isPost: topPage === 'post',
      isSearch: topPage === 'search',
      isAuth: topPage === 'auth',
      isArticle: pageIndex === 'post-article',
      isPage: topPage === 'page',
      fullPage: pageIndex,
      subPage
    };
  }

  updateSiderVisible(visible: boolean) {
    this.siderVisible.next(visible);
  }

  getReferrer(onlyPath = false) {
    let referrer: string;
    if (this.platform.isServer) {
      const headers = this.request?.headers;
      referrer = headers ? headers.get('referer') || headers.get('referrer') || '' : '';
    } else {
      referrer = this.document.referrer || '';
    }

    return onlyPath ? referrer.replace(/^https?:\/\/[^/]+/i, '') : referrer;
  }

  getResolution() {
    return this.platform.isBrowser ? window.screen.width + 'x' + window.screen.height : '';
  }

  getShareURL(userId?: string) {
    userId = userId || this.cookieService.get(COOKIE_KEY_USER_ID);

    const shareUrl = location.href.split('#')[0];
    const param = (shareUrl.includes('?') ? '&' : '?') + 'ref=qrcode' + (userId ? '&uid=' + userId : '');

    return shareUrl + param;
  }

  getTheme(): Theme {
    const cacheTheme = this.cookieService.get(COOKIE_KEY_THEME);
    if (cacheTheme) {
      return cacheTheme === Theme.Dark ? Theme.Dark : Theme.Light;
    }
    if (this.platform.isBrowser) {
      if (window.matchMedia(MEDIA_QUERY_THEME_DARK).matches) {
        return Theme.Dark;
      }
      if (window.matchMedia(MEDIA_QUERY_THEME_LIGHT).matches) {
        return Theme.Light;
      }
    }
    // todo: init by different time zone
    const curHour = new Date().getHours();
    const isNight = curHour >= 19 || curHour <= 6;

    return isNight ? Theme.Dark : Theme.Light;
  }

  setTheme(theme: Theme) {
    const htmlNode = this.document.getElementsByTagName('html')[0];
    htmlNode.setAttribute('data-theme', theme);
    this.darkMode.next(theme === Theme.Dark);
  }

  cacheTheme(theme: Theme) {
    this.cookieService.set(COOKIE_KEY_THEME, theme, {
      path: '/',
      domain: environment.cookie.domain,
      expires: environment.cookie.expires
    });
  }

  isThemeCached(): boolean {
    return !!this.cookieService.get(COOKIE_KEY_THEME);
  }

  updateTheme(theme: Theme) {
    this.setTheme(theme);
    this.cacheTheme(theme);
  }

  paddingPreview(eleRef: ElementRef) {
    eleRef.nativeElement.classList.add('preview-padding');
  }

  redirectToNotFound() {
    if (this.platform.isServer) {
      this.response.status = HttpStatusCode.NotFound;
    }
    throw new CustomError(Message.ERROR_404, HttpStatusCode.NotFound);
  }
}
