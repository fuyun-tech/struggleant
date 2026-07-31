import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { SigninResponse } from 'src/app/interfaces/auth';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { BaseComponent } from '../../core/base.component';
import { OptionEntity } from '../../interfaces/option';
import { TenantAppVo } from '../../interfaces/tenant-app';
import { USER_EMAIL_LENGTH, USER_PASSWORD_MAX_LENGTH } from '../../pages/auth/auth.constant';
import { AuthService } from '../../services/auth.service';
import { DestroyService } from '../../services/destroy.service';
import { OptionService } from '../../services/option.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { format } from '../../utils/helper';

@Component({
  selector: 'app-signin-form',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule
  ],
  providers: [DestroyService],
  templateUrl: './signin-form.component.html'
})
export class SigninFormComponent extends BaseComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly uaService = inject(UserAgentService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly authService = inject(AuthService);

  readonly isModal = input(true);
  readonly padding = input(false);
  readonly closeForm = output<void>();

  readonly maxNameLength = USER_EMAIL_LENGTH;
  readonly maxPasswordLength = USER_PASSWORD_MAX_LENGTH;

  readonly signinForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(this.maxNameLength)]],
    password: [null, [Validators.required, Validators.maxLength(this.maxPasswordLength)]]
  });
  readonly signinLoading = signal(false);
  readonly oauthMap = signal<Record<string, boolean>>({
    wechat: false,
    qq: false,
    alipay: false,
    weibo: false,
    github: false
  });
  readonly isSignupEnable = computed(() => {
    return this.options()['open_signup'] === '1';
  });
  readonly isOauthEnable = computed(() => {
    const oauthMap = this.oauthMap();

    return oauthMap['wechat'] || oauthMap['qq'] || oauthMap['alipay'] || oauthMap['weibo'] || oauthMap['github'];
  });

  private readonly isMobile = this.uaService.isMobile;
  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly referrer = signal('');

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
        this.oauthMap.update((data) => ({
          ...data,
          alipay: !!options['open_alipay_app_id'],
          weibo: !!options['open_weibo_app_key'],
          github: !!options['open_github_client_id']
        }));

        const ref = qp.get('ref')?.trim() || '';
        try {
          this.referrer.set(decodeURIComponent(ref));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          this.referrer.set(ref);
        }
        if (ref === 'signout') {
          this.authService.clearAuth();
        }
      });
  }

  signin() {
    const { value, valid } = this.validateForm(this.signinForm);
    if (this.signinLoading() || !valid) {
      return;
    }
    const { name, password } = value;
    this.signinLoading.set(true);
    this.authService
      .signin({
        name,
        password
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.signinLoading.set(false);
        const authInfo: SigninResponse = res.data || {};

        if (authInfo.token?.token) {
          const referrer = this.referrer();
          const appInfo = this.appInfo();
          const urlParam = format(ADMIN_URL_PARAM, authInfo.token.token, APP_ID);
          let redirectUrl: string;

          if (!this.isModal()) {
            if (referrer && referrer !== 'signout') {
              const separator = referrer.indexOf('?') >= 0 ? '&' : '?';
              if (/^https?:\/\//i.test(referrer)) {
                // 绝对路径
                redirectUrl = referrer + separator + urlParam;
              } else {
                // 相对路径，不需要带上token
                redirectUrl = appInfo?.homeUrl + '/' + referrer.replace(/^\//i, '');
              }
            } else {
              redirectUrl = appInfo?.adminUrl + '?' + urlParam;
            }
            location.href = redirectUrl;
          } else {
            location.reload();
          }
        } else if (res.code === ResponseCode.USER_UNVERIFIED) {
          const user = authInfo.user || {};

          if (user.userId) {
            this.closeForm.emit();
            this.router
              .navigate(['/user/confirm'], {
                queryParams: {
                  userId: user.userId
                }
              })
              .then();
          }
        }
      });
  }

  oauthSignin(type: string): void {
    if (!this.oauthMap()[type]) {
      this.message.warning('Sorry, we are stepping up our efforts to launch this feature, please wait...');
      return;
    }
    const url = this.authService.getOauthURL({
      type,
      options: this.options(),
      callbackUrl: this.appInfo()?.callbackUrl || '',
      ref: '',
      isMobile: this.isMobile
    });
    if (url) {
      location.href = url;
    }
  }
}
