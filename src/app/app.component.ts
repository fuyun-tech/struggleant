import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { environment } from 'env/environment';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { filter, takeWhile, tap } from 'rxjs/operators';
import { BotChatComponent } from 'src/app/components/bot-chat/bot-chat.component';
import { FooterComponent } from 'src/app/components/footer/footer.component';
import { HeaderComponent } from 'src/app/components/header/header.component';
import { LoginModalComponent } from 'src/app/components/login-modal/login-modal.component';
import { MSiderComponent } from 'src/app/components/m-sider/m-sider.component';
import { COOKIE_KEY_UV_ID, MEDIA_QUERY_THEME_DARK } from 'src/app/config/common.constant';
import { ResponseCode } from 'src/app/config/response-code.enum';
import { Theme } from 'src/app/enums/common';
import { AdsStatus } from 'src/app/enums/log';
import { PostScope, PostStatus } from 'src/app/enums/post';
import { ErrorState, LoginModalOptions, PageIndexInfo } from 'src/app/interfaces/common';
import { Post } from 'src/app/interfaces/post';
import { TaxonomyNode } from 'src/app/interfaces/taxonomy';
import { ForbiddenComponent } from 'src/app/pages/error/forbidden/forbidden.component';
import { NotFoundComponent } from 'src/app/pages/error/not-found/not-found.component';
import { ServerErrorComponent } from 'src/app/pages/error/server-error/server-error.component';
import { AdsService } from 'src/app/services/ads.service';
import { CommonService } from 'src/app/services/common.service';
import { ErrorService } from 'src/app/services/error.service';
import { LogService } from 'src/app/services/log.service';
import { OptionService } from 'src/app/services/option.service';
import { PlatformService } from 'src/app/services/platform.service';
import { PostService } from 'src/app/services/post.service';
import { SsrCookieService } from 'src/app/services/ssr-cookie.service';
import { TaxonomyService } from 'src/app/services/taxonomy.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UrlService } from 'src/app/services/url.service';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { UserService } from 'src/app/services/user.service';
import { generateUid } from 'src/app/utils/helper';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NotFoundComponent,
    ForbiddenComponent,
    ServerErrorComponent,
    MSiderComponent,
    LoginModalComponent,
    BotChatComponent,
    NzButtonModule,
    NzTooltipModule,
    NzIconModule
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit, AfterViewInit {
  isMobile: boolean = false;
  postTaxonomies: TaxonomyNode[] = [];
  errorState!: ErrorState;
  errorPage = false;
  isBodyCentered = false;
  siderVisible = false;
  indexInfo?: PageIndexInfo;
  post: Post | null = null;
  chatVisible = false;
  conversationId = '';
  chatPrompt = '';
  loginOptions: LoginModalOptions = {
    visible: false,
    closable: true
  };

  private isSignIn = false;
  private currentUrl = '';
  private initialized = false;
  private accessLogId = '';
  private bodyOffset = 0;
  private adsStatus: AdsStatus = AdsStatus.UNKNOWN;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly message: NzMessageService,
    private readonly platform: PlatformService,
    private readonly userAgentService: UserAgentService,
    private readonly cookieService: SsrCookieService,
    private readonly commonService: CommonService,
    private readonly urlService: UrlService,
    private readonly optionService: OptionService,
    private readonly errorService: ErrorService,
    private readonly userService: UserService,
    private readonly tenantAppService: TenantAppService,
    private readonly taxonomyService: TaxonomyService,
    private readonly logService: LogService,
    private readonly postService: PostService,
    private readonly adsService: AdsService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        tap((re) => {
          if (re instanceof NavigationStart) {
            this.errorPage = re.url.startsWith('/error/');
            if (!this.errorPage) {
              this.errorService.hideError();
            }

            this.commonService.updateLoginModalVisible({
              visible: false,
              closable: true
            });
          }
        }),
        filter((re) => re instanceof NavigationEnd)
      )
      .subscribe((event) => {
        this.isBodyCentered = !!this.route.firstChild?.snapshot.data['centered'];

        let faId = this.cookieService.get(COOKIE_KEY_UV_ID);
        let isNew = false;
        if (!faId) {
          isNew = true;
          faId = generateUid(this.userAgentService.uaString);
          this.cookieService.set(COOKIE_KEY_UV_ID, faId, {
            path: '/',
            domain: environment.cookie.domain,
            expires: 400
          });
        }

        const previous = this.currentUrl.split('#')[0];
        const current = (event as NavigationEnd).url.split('#')[0];
        if (previous !== current) {
          this.urlService.updateUrlHistory({
            previous: this.currentUrl,
            current: (event as NavigationEnd).url
          });
          if (this.platform.isBrowser) {
            this.logService
              .logAccess(
                this.logService.parseAccessLog({
                  initialized: this.initialized,
                  referrer: this.currentUrl,
                  isNew,
                  adsStatus: this.adsStatus,
                  logId: this.accessLogId
                })
              )
              .subscribe((res) => {
                if (res.code === ResponseCode.SUCCESS) {
                  const oldAccessLogId = this.accessLogId;

                  this.accessLogId = res.data.logId || '';
                  this.logAdsStatus({
                    oldLogId: oldAccessLogId
                  });
                }
              });
          }
          this.currentUrl = (event as NavigationEnd).url;
        }
        this.initialized = true;
      });

    this.initTheme();
    this.initThemeListener();
    this.optionService.getOptions().subscribe();
    this.tenantAppService.getAppInfo().subscribe();
    this.userService.getLoginUser().subscribe((user) => {
      this.isSignIn = !!user.userId;
    });
    this.commonService.siderVisible$.subscribe((visible) => {
      if (this.platform.isBrowser) {
        if (visible) {
          this.bodyOffset = document.documentElement.scrollTop;
          document.documentElement.style.position = 'fixed';
          document.documentElement.style.top = `-${this.bodyOffset}px`;
        } else {
          document.documentElement.style.position = '';
          document.documentElement.style.top = '';
          window.scrollTo({
            top: this.bodyOffset,
            behavior: 'instant'
          });
        }
      }
      this.siderVisible = visible;
    });
    this.commonService.pageIndex$.subscribe((page) => {
      this.indexInfo = this.commonService.getPageIndexInfo(page);
      this.cdr.detectChanges();
    });
    this.commonService.loginVisible$.subscribe((loginOptions) => {
      this.loginOptions = loginOptions;
    });
    this.taxonomyService.getTaxonomies().subscribe((taxonomies) => (this.postTaxonomies = taxonomies));
    this.postService.activePost$.subscribe((post) => {
      this.post = post;
    });
    this.errorService.errorState$.subscribe((state) => {
      this.errorState = state;
    });

    if (this.platform.isBrowser) {
      this.adsService.adsStatus$
        .pipe(takeWhile((status) => status !== AdsStatus.DISABLED, true))
        .subscribe((status) => {
          const oldAdsStatus = this.adsStatus;

          this.adsStatus = status;
          this.logAdsStatus({
            oldStatus: oldAdsStatus
          });
        });
    }
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('pagehide', () => {
        this.logService.logLeave({
          logId: this.accessLogId
        });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.logService.logLeave({
            logId: this.accessLogId
          });
        }
      });
    }
  }

  closeSider() {
    this.siderVisible = false;
    this.commonService.updateSiderVisible(false);
  }

  showLoginModal(closable = true) {
    this.commonService.updateLoginModalVisible({
      visible: true,
      closable
    });
  }

  closeLoginModal() {
    this.commonService.updateLoginModalVisible({
      visible: false,
      closable: true
    });
  }

  showChat() {
    if (!this.isSignIn) {
      this.showLoginModal();
      return;
    }
    if (!this.post) {
      return;
    }
    if (!!this.post.post.postLoginFlag || !!this.post.post.postPayFlag) {
      this.message.warning('会员或付费文章无法使用 AI 阅读助手功能');
      return;
    }
    if (this.post.post.postStatus !== PostStatus.PUBLISH || this.post.post.postScope !== PostScope.PUBLIC) {
      this.message.warning('非公开文章无法使用 AI 阅读助手功能');
      return;
    }
    this.chatVisible = true;
  }

  closeChat() {
    this.chatPrompt = '';
    this.chatVisible = false;
  }

  checkAdsStatus(isLoaded: boolean) {
    this.adsService.updateAdsStatus(isLoaded ? AdsStatus.ENABLED : AdsStatus.BLOCKED);
  }

  private logAdsStatus(param: { oldLogId?: string; oldStatus?: AdsStatus }) {
    const { oldLogId, oldStatus } = param;

    // 同应用异步跳转直接合并在日志请求，无需额外请求
    if (!oldLogId && this.accessLogId && this.adsStatus && this.adsStatus !== oldStatus) {
      this.logService.logAdsStatus(this.accessLogId, this.adsStatus).subscribe(() => {});
    }
  }

  private initTheme() {
    const theme = this.commonService.getTheme();
    this.commonService.setTheme(theme);
  }

  private initThemeListener() {
    if (this.platform.isBrowser) {
      window.matchMedia(MEDIA_QUERY_THEME_DARK).addEventListener('change', (event) => {
        if (!this.commonService.isThemeCached()) {
          this.commonService.setTheme(event.matches ? Theme.Dark : Theme.Light);
        }
      });
    }
  }
}
