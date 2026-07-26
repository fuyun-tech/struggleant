import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { PostItemComponent } from 'src/app/components/post-item/post-item.component';
import { BookVo } from 'src/app/interfaces/book';
import { BookColumnEntity } from 'src/app/interfaces/book-column';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { OptionEntity } from 'src/app/interfaces/option';
import { PostQueryParam, PostVo } from 'src/app/interfaces/post';
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
  selector: 'app-post-list',
  imports: [NzEmptyModule, BreadcrumbComponent, PaginationComponent, MakeMoneyComponent, PostItemComponent],
  providers: [DestroyService],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.less'
})
export class PostListComponent implements OnInit {
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
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly total = signal(0);
  readonly posts = signal<PostVo[]>([]);
  readonly isSection = signal(false);
  readonly paginationUrl = computed(() => {
    const bookId = this.bookId();
    const postBook = this.postBook();
    const columnSlug = this.bookColumnSlug();

    if (bookId) {
      if (columnSlug) {
        return `/journal/${postBook?.bookMeta.id}/${bookId}/section/${columnSlug}`;
      }
      return `/journal/${postBook?.bookMeta.id}/${bookId}/posts`;
    }
    if (this.bookColumnId()) {
      return `/column/${this.bookColumnId()}`;
    }
    if (this.category()) {
      return `/category/${this.category()}`;
    }
    if (this.tag()) {
      return `/tag/${this.tag()}`;
    }
    if (this.year()) {
      return `/archive/${this.year()}${this.month() ? '/' + this.month() : ''}`;
    }

    return '/posts';
  });

  protected readonly pageIndex = signal('post-list');

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly lastParam = signal('');
  private readonly category = signal('');
  private readonly tag = signal('');
  private readonly year = signal('');
  private readonly month = signal('');
  private readonly bookId = signal('');
  private readonly bookColumnSlug = signal('');
  private readonly bookColumnId = signal('');
  private readonly postBook = signal<BookVo | null>(null);
  private readonly postBookColumn = signal<BookColumnEntity | null>(null);
  private readonly postBookName = computed(() => {
    return this.bookService.getBookName(this.postBook(), false);
  });

  ngOnInit(): void {
    combineLatest([
      this.tenantAppService.appInfo$,
      this.optionService.options$,
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { queryParamMap: qp, paramMap: p } = this.route.snapshot;

        this.appInfo.set(appInfo);
        this.options.set(options);

        this.pageSize.set(Number(this.options()['post_page_size']) || 10);
        this.page.set(Number(qp.get('page')) || 1);

        this.bookId.set(p.get('bookId')?.trim() || '');
        this.bookColumnSlug.set(p.get('columnSlug')?.trim() || '');
        this.bookColumnId.set(p.get('columnId')?.trim() || '');
        this.category.set(p.get('category')?.trim() || '');
        this.tag.set(p.get('tag')?.trim() || '');
        this.year.set(p.get('year')?.trim() || '');
        this.month.set(p.get('month')?.trim() || '');

        this.isSection.set(!!this.bookId());

        const latestParam = JSON.stringify({
          page: this.page(),
          bookId: this.bookId(),
          bookColumnSlug: this.bookColumnSlug(),
          bookColumnId: this.bookColumnId(),
          category: this.category(),
          tag: this.tag(),
          year: this.year(),
          month: this.month()
        });
        if (latestParam === this.lastParam()) {
          return;
        }
        this.lastParam.set(latestParam);
        this.pageIndex.set(this.year() ? 'post-archive' : 'post-list');

        this.updatePageIndex();
        if (this.bookId() || this.bookColumnId()) {
          this.getPostsByBookId();
        } else {
          this.getPosts();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex());
  }

  private getPosts() {
    const param: PostQueryParam = {
      page: this.page(),
      size: this.pageSize()
    };
    if (this.category()) {
      param.category = this.category();
    }
    if (this.tag()) {
      param.tag = this.tag();
    }
    if (this.year()) {
      param.year = this.year();
      if (this.month()) {
        param.month = this.month();
      }
    }

    this.postService
      .getPosts(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts.set(res.posts?.list || []);
        this.page.set(res.posts?.page || 1);
        this.total.set(res.posts?.total || 0);
        this.postBook.set(null);
        this.postBookColumn.set(null);

        const breadcrumbs = (res.breadcrumbs || []).map((item) => ({
          ...item,
          url: `/category/${item.slug}`
        }));
        this.initData(breadcrumbs);
      });
  }

  private getPostsByBookId() {
    this.postService
      .getPostsByBookId({
        page: this.page(),
        size: this.pageSize(),
        bookId: this.bookId(),
        columnSlug: this.bookColumnSlug(),
        columnId: this.bookColumnId(),
        simple: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts.set(res.posts?.list || []);
        this.page.set(res.posts?.page || 1);
        this.total.set(res.posts?.total || 0);
        this.postBook.set(res.book || null);
        this.postBookColumn.set(res.bookColumn || null);

        this.initData([]);
      });
  }

  private initData(breadcrumbs: BreadcrumbEntity[]) {
    this.updatePageInfo(breadcrumbs);
    this.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo(breadcrumbData: BreadcrumbEntity[]) {
    const appInfo = this.appInfo()!;
    const tag = this.tag();
    const postBook = this.postBook();
    const postBookColumn = this.postBookColumn();
    const titles: string[] = [appInfo.name];
    const keywords: string[] = [...appInfo.keywords];
    let description = '';

    if (this.category() && breadcrumbData.length > 0) {
      const label = breadcrumbData[breadcrumbData.length - 1].label;
      titles.unshift(label, '分类');
      keywords.unshift(label);

      description += `「${label}」`;
    } else if (tag) {
      titles.unshift(tag, '标签');
      keywords.unshift(tag);

      description += `「${tag}」`;
    } else if (this.year()) {
      const label = `${this.year()}年${this.month() ? this.month() + '月' : ''}`;
      titles.unshift(label, '归档', '期刊');
      description += label;
    } else if (postBook) {
      titles.unshift(postBook.bookMeta.name);
      if (postBook.issue) {
        titles.unshift(postBook.issue);
      }
      description += this.postBookName().fullName;
      keywords.unshift(postBook.bookMeta.name);

      if (postBookColumn) {
        titles.unshift(postBookColumn.name);
        description += `「${postBookColumn.name}」`;
        keywords.unshift(postBookColumn.name);
      }
    }
    if (description) {
      description += '文章列表';
    }
    if (titles.length < 2) {
      titles.unshift('文章列表');
    }
    if (this.page() > 1) {
      titles.unshift(`第${this.page()}页`);
      if (description) {
        description += `(第${this.page()}页)`;
      }
    }
    if (description) {
      description += '。';
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

  private updateBreadcrumbs(breadcrumbData: BreadcrumbEntity[]) {
    const tag = this.tag();
    const postBook = this.postBook();
    const postBookColumn = this.postBookColumn();
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '期刊',
        tooltip: '期刊',
        url: '/posts',
        isHeader: false
      }
    ];
    if (tag) {
      breadcrumbs.push(
        {
          label: '标签',
          tooltip: '标签',
          url: '',
          isHeader: false
        },
        {
          label: tag,
          tooltip: tag,
          url: `/tag/${tag}`,
          isHeader: true
        }
      );
    } else if (this.year()) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: `归档`,
          url: `/archive`,
          isHeader: false
        },
        {
          label: `${this.year()}年`,
          tooltip: `${this.year()}年`,
          url: `/archive/${this.year()}`,
          isHeader: !this.month()
        }
      );
      if (this.month()) {
        breadcrumbs.push({
          label: `${Number(this.month())}月`,
          tooltip: `${this.year()}年${this.month()}月`,
          url: `/archive/${this.year()}/${this.month()}`,
          isHeader: true
        });
      }
    } else if (breadcrumbData.length > 0) {
      breadcrumbs = breadcrumbs.concat(breadcrumbData);
    } else if (postBook) {
      if (this.bookColumnId() && postBookColumn) {
        breadcrumbs.push(
          {
            label: '栏目',
            tooltip: '栏目',
            url: '',
            isHeader: false
          },
          {
            label: `《${postBook.bookMeta.name}》: ${postBookColumn.name}`,
            tooltip: `《${postBook.bookMeta.name}》: ${postBookColumn.name}`,
            url: `/column/${postBookColumn.id}`,
            isHeader: true
          }
        );
      } else {
        breadcrumbs.push({
          label: postBook.bookMeta.name,
          tooltip: postBook.bookMeta.name,
          url: '',
          isHeader: false
        });
        if (postBook.issue) {
          breadcrumbs.push({
            label: postBook.issue,
            tooltip: postBook.issue,
            url: `/journal/${postBook.bookMeta.id}/${postBook.id}`,
            isHeader: !this.bookColumnSlug()
          });
        }
        if (postBookColumn) {
          breadcrumbs.push({
            label: postBookColumn.name,
            tooltip: postBookColumn.name,
            url: `/journal/${postBook.bookMeta.id}/${postBook.id}/section/${postBookColumn.slug}`,
            isHeader: true
          });
        }
      }
    }
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
