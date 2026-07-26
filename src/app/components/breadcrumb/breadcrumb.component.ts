import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { TenantAppVo } from '../../interfaces/tenant-app';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { DestroyService } from '../../services/destroy.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, NzIconModule],
  providers: [DestroyService],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.less'
})
export class BreadcrumbComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly uaService = inject(UserAgentService);

  readonly isMobile = this.uaService.isMobile;
  readonly breadcrumbs = signal<BreadcrumbEntity[]>([]);

  private readonly appInfo = signal<TenantAppVo | null>(null);

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.breadcrumbService.breadcrumbs$])
      .pipe(
        skipWhile(([appInfo]) => isEmpty(appInfo)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, breadcrumbs]) => {
        this.appInfo.set(appInfo);

        if (breadcrumbs.length > 0) {
          this.breadcrumbs.set([
            {
              label: '首页',
              url: '/',
              tooltip: appInfo.name,
              isHeader: false
            },
            ...breadcrumbs
          ]);
        }
      });
  }
}
