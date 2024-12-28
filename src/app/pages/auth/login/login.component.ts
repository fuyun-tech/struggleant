import { Component, OnInit } from '@angular/core';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BaseComponent } from '../../../base.component';
import { LoginFormComponent } from '../../../components/login-form/login-form.component';
import { OptionEntity } from '../../../interfaces/option';
import { TenantAppModel } from '../../../interfaces/tenant-app';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { CommonService } from '../../../services/common.service';
import { DestroyService } from '../../../services/destroy.service';
import { MetaService } from '../../../services/meta.service';
import { OptionService } from '../../../services/option.service';
import { TenantAppService } from '../../../services/tenant-app.service';

@Component({
  selector: 'app-login',
  imports: [LoginFormComponent],
  providers: [DestroyService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.less'
})
export class LoginComponent extends BaseComponent implements OnInit {
  protected pageIndex = 'auth-login';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};

  constructor(
    private readonly destroy$: DestroyService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService
  ) {
    super();
  }

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();

    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.updatePageInfo();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private updatePageInfo() {
    this.metaService.updateHTMLMeta({
      title: ['登录', this.appInfo.appName].join(' - '),
      description: this.appInfo.appDescription,
      author: this.options['site_author'],
      keywords: uniq(this.appInfo.keywords).join(',')
    });
  }

  private updateBreadcrumbs() {
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}