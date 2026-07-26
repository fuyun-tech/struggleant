import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  input,
  model,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { skipWhile, takeUntil } from 'rxjs';
import { ADMIN_URL_PARAM, APP_ID } from '../../config/common.constant';
import { ResponseCode } from '../../config/response-code.enum';
import { CategoryNode } from '../../interfaces/category';
import { PageIndexInfo } from '../../interfaces/common';
import { TenantAppVo } from '../../interfaces/tenant-app';
import { UserModel } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';
import { UserService } from '../../services/user.service';
import { format } from '../../utils/helper';

@Component({
  selector: 'app-header',
  imports: [RouterLink, FormsModule, NzInputModule, NzIconModule, NzButtonModule],
  providers: [DestroyService, NzImageService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less'
})
export class HeaderComponent implements OnInit, AfterViewChecked {
  private readonly destroy$ = inject(DestroyService);
  private readonly router = inject(Router);
  private readonly uaService = inject(UserAgentService);
  private readonly message = inject(NzMessageService);
  private readonly commonService = inject(CommonService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  readonly categories = input<CategoryNode[]>([]);

  readonly mSearchInput = viewChild<ElementRef<HTMLInputElement>>('mSearchInput');

  readonly isMobile = this.uaService.isMobile;
  readonly isSignIn = signal(false);
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly appInfo = signal<TenantAppVo | null>(null);
  readonly user = signal<UserModel | null>(null);
  readonly keyword = model('');
  readonly searchVisible = signal(false);
  readonly isFocused = signal(false);

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
        if (appInfo.adminUrl) {
          this.adminUrl.set(appInfo.adminUrl + '?' + urlParam);
        }
      });
    this.commonService.pageIndex$.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.indexInfo.set(this.commonService.getPageIndexInfo(page));
    });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user.set(user);
      this.isSignIn.set(!!user.id);
    });
  }

  ngAfterViewChecked(): void {
    const $input = this.mSearchInput();
    if (!this.isFocused() && $input) {
      $input.nativeElement.focus();

      this.isFocused.set(true);
    }
  }

  search(): void {
    const keyword = this.keyword().trim();
    if (!keyword) {
      this.message.error('请输入搜索关键词');

      if (this.isMobile) {
        this.mSearchInput()?.nativeElement.focus();
      }
      return;
    }
    this.router
      .navigate(['/search'], {
        queryParams: {
          keyword
        }
      })
      .then();
  }

  showSearch() {
    this.searchVisible.set(true);
  }

  hideSearch() {
    this.searchVisible.set(false);
    this.isFocused.set(false);
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

  showSider() {
    this.commonService.updateSiderVisible(true);
  }
}
