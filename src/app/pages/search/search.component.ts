import { HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { PostItemComponent } from 'src/app/components/post-item/post-item.component';
import { Message } from 'src/app/config/message.enum';
import { CustomError } from 'src/app/core/custom-error';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { OptionEntity } from 'src/app/interfaces/option';
import { SearchResponse } from 'src/app/interfaces/search';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { SearchService } from 'src/app/services/search.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-search',
  imports: [NzEmptyModule, BreadcrumbComponent, PaginationComponent, PostItemComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly searchService = inject(SearchService);

  readonly isMobile = this.uaService.isMobile;
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly searchResult = signal<SearchResponse[]>([]);
  readonly paginationUrl = '/search';
  readonly paginationParams = computed(() => ({
    keyword: this.keyword()
  }));

  protected readonly pageIndex = 'search';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly keyword = signal('');

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.queryParamMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, qp]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);

        this.pageSize.set(Number(this.options()['post_page_size']) || 10);
        this.page.set(Number(qp.get('page')) || 1);
        this.keyword.set(qp.get('keyword')?.trim() || '');

        this.updatePageIndex();
        this.updatePageInfo();
        this.updateBreadcrumbs();

        if (!this.keyword()) {
          throw new CustomError(Message.SEARCH_KEYWORD_IS_NULL, HttpStatusCode.BadRequest);
        }
        this.search();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private search() {
    this.searchService
      .search({
        keyword: this.keyword(),
        page: this.page()
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.searchResult.set(res.list);
        this.page.set(res.page || 1);
        this.total.set(res.total || 0);
      });
  }

  private updatePageInfo() {
    const titles: string[] = [this.keyword(), '搜索', this.appInfo()!.name];
    const keywords: string[] = [...this.appInfo()!.keywords];
    let description = `「${this.keyword()}」期刊搜索结果`;

    keywords.unshift(...this.keyword().split(/\s+/i));

    if (this.page() > 1) {
      titles.unshift(`第${this.page()}页`);
      if (description) {
        description += `(第${this.page()}页)`;
      }
    }
    description += '。';
    description += this.appInfo()!.description;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }

  private updateBreadcrumbs() {
    if (!this.keyword()) {
      this.breadcrumbService.updateBreadcrumbs([]);
      return;
    }
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '搜索',
        tooltip: '搜索',
        url: '',
        isHeader: false
      },
      {
        label: this.keyword(),
        tooltip: this.keyword(),
        url: '/search',
        param: {
          keyword: this.keyword()
        },
        isHeader: true
      }
    ];
    if (this.page() > 1) {
      breadcrumbs.push({
        label: `第${this.page()}页`,
        tooltip: `第${this.page()}页`,
        url: '',
        isHeader: false
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
