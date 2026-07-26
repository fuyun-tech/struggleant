import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { BookVo } from 'src/app/interfaces/book';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { OptionEntity } from 'src/app/interfaces/option';
import { PostCatalog } from 'src/app/interfaces/post';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { BookService } from 'src/app/services/book.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PostService } from 'src/app/services/post.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-journal-detail',
  imports: [RouterLink, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './journal-detail.component.html',
  styleUrl: './journal-detail.component.less'
})
export class JournalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);
  private readonly bookService = inject(BookService);

  readonly isMobile = this.uaService.isMobile;
  readonly book = signal<BookVo | null>(null);
  readonly catalogs = signal<PostCatalog[]>([]);

  protected readonly pageIndex = 'journal-detail';

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly bookId = signal('');

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { paramMap: p } = this.route.snapshot;

        this.appInfo.set(appInfo);
        this.options.set(options);

        this.bookId.set(p.get('bookId')?.trim() || '');

        if (!this.bookId()) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.updatePageIndex();
        this.getBook();
        this.getPostsWithColumn();
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getBook() {
    this.bookService
      .getBookById(this.bookId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.book.set(res || {});

        if (!res || !res.id) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.initData();
      });
  }

  private getPostsWithColumn() {
    this.postService
      .getPostsWithColumn(this.bookId())
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const posts = (res || []).sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        const catalogMap: Record<string, PostCatalog> = {};

        posts.forEach((post) => {
          if (post.bookColumn) {
            if (catalogMap[post.bookColumn.id]) {
              catalogMap[post.bookColumn.id].posts.push(post);
            } else {
              catalogMap[post.bookColumn.id] = {
                ...post.bookColumn,
                posts: [post]
              };
            }
          } else {
            if (catalogMap['other']) {
              catalogMap['other'].posts.push(post);
            } else {
              catalogMap['other'] = {
                id: '',
                name: '其它',
                slug: 'others',
                sort: 999,
                posts: [post]
              };
            }
          }
        });

        this.catalogs.set(Object.values(catalogMap).sort((a, b) => (a.sort > b.sort ? 1 : -1)));
      });
  }

  private initData() {
    this.updatePageInfo();
    this.updateBreadcrumbs();
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;
    const book = this.book()!;
    const titles: string[] = [book.bookMeta.name, appInfo.name];
    const keywords: string[] = [book.bookMeta.name, ...appInfo.keywords];
    let description = book.bookMeta.name;

    if (book.issue) {
      titles.unshift(book.issue);
      description += book.issue + '。';
    }

    description += appInfo.description;

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
    const book = this.book()!;
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '期刊',
        tooltip: '期刊',
        url: '/posts',
        isHeader: false
      },
      {
        label: book.bookMeta.name,
        tooltip: book.bookMeta.name,
        url: '',
        isHeader: !book.issue
      }
    ];
    if (book.issue) {
      breadcrumbs.push({
        label: book.issue,
        tooltip: book.issue,
        url: `/journal/${book.bookMeta.id}/${book.id}`,
        isHeader: true
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
