import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { skipWhile, takeUntil } from 'rxjs';
import { IconCalendarDateComponent } from 'src/app/icons/icon-calendar-date.component';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { LogActionType, LogTargetType } from '../../enums/log';
import { PageIndexInfo } from '../../interfaces/common';
import { TenantAppVo } from '../../interfaces/tenant-app';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { LogService } from '../../services/log.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserService } from '../../services/user.service';
import { format } from '../../utils/helper';

@Component({
  selector: 'app-m-sider',
  imports: [RouterLink, NzIconModule, IconCalendarDateComponent],
  providers: [DestroyService, NzImageService],
  templateUrl: './m-sider.component.html',
  styleUrl: './m-sider.component.less'
})
export class MSiderComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly imageService = inject(NzImageService);
  private readonly commonService = inject(CommonService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly logService = inject(LogService);

  readonly siderVisible = signal(false);
  readonly isSignIn = signal(false);
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly appInfo = signal<TenantAppVo | null>(null);

  private readonly adminUrl = signal('');

  ngOnInit(): void {
    this.tenantAppService.appInfo$
      .pipe(
        skipWhile((appInfo) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe((appInfo) => {
        const urlParam = format(ADMIN_URL_PARAM, this.authService.getToken(), APP_ID);

        this.appInfo.set(appInfo);
        this.adminUrl.set(appInfo.adminUrl + '?' + urlParam);
      });
    this.commonService.siderVisible$.subscribe((visible) => {
      this.siderVisible.set(visible);
    });
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo.set(this.commonService.getPageIndexInfo(page));
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isSignIn.set(!!user.id);
    });
  }

  closeSider() {
    this.siderVisible.set(false);

    this.commonService.updateSiderVisible(false);
  }

  showWechatCard() {
    this.siderVisible.set(false);

    this.commonService.updateSiderVisible(false);
    this.imageService.preview([
      {
        src: '/assets/images/wechat-qrcode.jpg'
      }
    ]);

    this.logService
      .logAction({
        action: LogActionType.SHOW_WECHAT_CARD,
        targetType: LogTargetType.SIDER
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  gotoAdmin() {
    window.open(this.adminUrl());
  }

  signout() {
    this.authService
      .signout()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.code === ResponseCode.SUCCESS) {
          location.reload();
        }
      });
  }
}
