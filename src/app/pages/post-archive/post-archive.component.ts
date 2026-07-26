import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { ArchiveDataMap } from 'src/app/interfaces/common';
import { OptionEntity } from 'src/app/interfaces/option';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PostService } from 'src/app/services/post.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-post-archive',
  imports: [RouterLink, BreadcrumbComponent],
  providers: [DestroyService],
  templateUrl: './post-archive.component.html'
})
export class PostArchiveComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);

  readonly isMobile = this.uaService.isMobile;
  readonly dateList = signal<ArchiveDataMap>({});
  readonly yearList = signal<string[]>([]);

  protected readonly pageIndex = 'post-archive';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});

  ngOnInit(): void {
    this.updatePageIndex();
    this.updateBreadcrumbs();
    this.getPostArchives();

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

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { dateList, yearList } = this.postService.buildArchiveList(res);
        this.dateList.set(dateList);
        this.yearList.set(yearList);
      });
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;
    const titles = ['归档', '期刊', appInfo.name];

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description: `${appInfo.name}期刊归档。${appInfo.description}`,
      keywords: appInfo.keywords,
      author: this.options()['site_author']
    });
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = [
      {
        label: '期刊',
        tooltip: '期刊',
        url: '/posts',
        isHeader: false
      },
      {
        label: '归档',
        tooltip: `期刊归档`,
        url: '/archive',
        isHeader: true
      }
    ];
    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
