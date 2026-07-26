import { Component, inject, OnInit, signal } from '@angular/core';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { SigninFormComponent } from 'src/app/components/signin-form/signin-form.component';
import { BaseComponent } from 'src/app/core/base.component';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';

@Component({
  selector: 'app-signin',
  imports: [SigninFormComponent],
  providers: [DestroyService],
  templateUrl: './signin.component.html'
})
export class SigninComponent extends BaseComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);

  protected readonly pageIndex = 'auth-signin';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.updatePageInfo();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
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
