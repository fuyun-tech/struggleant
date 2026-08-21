import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from 'src/app/config/common.constant';
import { ResponseCode } from 'src/app/config/response-code.enum';
import { CustomError } from 'src/app/core/custom-error';
import { UserSource } from 'src/app/enums/user';
import { SigninResponse } from 'src/app/interfaces/auth';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { AuthService } from 'src/app/services/auth.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PlatformService } from 'src/app/services/platform.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { format } from 'src/app/utils/helper';

@Component({
  selector: 'app-oauth-callback',
  imports: [NzIconModule],
  providers: [DestroyService],
  templateUrl: './oauth-callback.component.html',
  styleUrl: './oauth-callback.component.less'
})
export class OauthCallbackComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);

  protected readonly pageIndex = 'auth-signin';

  private appInfo = signal<TenantAppVo | null>(null);
  private options = signal<OptionEntity>({});
  private source = signal<UserSource | null>(null);
  private authCode = signal('');
  private scope = signal('');
  private errorCode = signal('');
  private ref = signal('');
  private state = signal('');

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
        this.source.set(<UserSource>parseInt(qp.get('from')?.trim() || '', 10));
        this.authCode.set(qp.get('auth_code')?.trim() || qp.get('code')?.trim() || '');
        this.scope.set(qp.get('scope')?.trim() || '');
        this.errorCode.set(qp.get('error_code')?.trim() || qp.get('error')?.trim() || '');
        this.ref.set(qp.get('ref')?.trim() || '');
        this.state.set(qp.get('state')?.trim() || '');

        this.updatePageInfo();

        if (!this.authCode()) {
          throw new CustomError('获取令牌超时或失败，请重新登录', HttpStatusCode.BadRequest);
        }
        if (!this.state()) {
          throw new CustomError('缺少state参数，请重新登录', HttpStatusCode.BadRequest);
        }

        try {
          const decodedState = JSON.parse(atob(this.state()));
          if (this.source() === UserSource.GITHUB && decodedState.ref) {
            this.ref.set(decodeURIComponent(decodedState.ref));
          } else {
            this.ref.set(decodeURIComponent(this.ref()));
          }
        } catch {}

        if (this.platform.isBrowser) {
          this.signin();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private signin() {
    const source = this.source();
    const ref = this.ref();

    if (!source) {
      this.message.error('登录方式不支持');
      this.router
        .navigate(['/user/signin'], {
          replaceUrl: true,
          queryParams: {
            ref: ref ? encodeURIComponent(ref) : null
          }
        })
        .then();

      return;
    }
    if (source === UserSource.WEIBO && this.errorCode() === '21330') {
      // cancel
      this.router
        .navigate(['/user/signin'], {
          replaceUrl: true,
          queryParams: {
            ref: ref ? encodeURIComponent(ref) : null
          }
        })
        .then();

      return;
    }
    if (source === UserSource.GITHUB && this.errorCode() === 'access_denied') {
      // cancel
      this.router
        .navigate(['/user/signin'], {
          replaceUrl: true,
          queryParams: {
            ref: ref ? encodeURIComponent(ref) : null
          }
        })
        .then();

      return;
    }

    this.authService
      .oauthSignin(this.authCode(), source)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const authInfo: SigninResponse = res.data || {};
        if (authInfo.token?.token) {
          // 不能用 router.navigate 跳转，否则会出现状态问题，并且会重复执行 signin() 两次
          const urlParam = format(ADMIN_URL_PARAM, authInfo.token.token, APP_ID);

          location.replace(this.appInfo()!.adminUrl + '?' + urlParam);
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user = authInfo.user;

          if (user?.userId) {
            this.router
              .navigate(['/user/confirm'], {
                relativeTo: this.route,
                replaceUrl: true,
                queryParams: {
                  userId: user.userId
                }
              })
              .then();
          }
        } else {
          throw new CustomError(res.message || '登录失败，请重新登录', HttpStatusCode.BadRequest);
        }
      });
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;

    this.metaService.updateHTMLMeta({
      title: ['登录', appInfo.name].join(' - '),
      description: appInfo.description,
      author: this.options()['site_author'],
      keywords: appInfo.keywords
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
