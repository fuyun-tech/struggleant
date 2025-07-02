import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BookColumnEntity } from 'src/app/interfaces/book-column';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { PostItemComponent } from '../../components/post-item/post-item.component';
import { BookEntity } from '../../interfaces/book';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { OptionEntity } from '../../interfaces/option';
import { Post, PostList, PostQueryParam } from '../../interfaces/post';
import { TenantAppModel } from '../../interfaces/tenant-app';
import { BookService } from '../../services/book.service';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { MetaService } from '../../services/meta.service';
import { OptionService } from '../../services/option.service';
import { PaginationService } from '../../services/pagination.service';
import { PostService } from '../../services/post.service';
import { TenantAppService } from '../../services/tenant-app.service';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-post-list',
  imports: [NgFor, NzEmptyModule, BreadcrumbComponent, PaginationComponent, MakeMoneyComponent, PostItemComponent],
  providers: [DestroyService],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.less'
})
export class PostListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  posts: Post[] = [];
  isSection = false;

  protected pageIndex = 'post-list';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private lastParam = '';
  private category = '';
  private tag = '';
  private year = '';
  private month = '';
  private bookId = '';
  private bookColumnSlug = '';
  private bookColumnId = '';
  private postBook?: BookEntity;
  private postBookColumn?: BookColumnEntity;

  get paginationUrl() {
    if (this.bookId) {
      if (this.bookColumnSlug) {
        return `/journal/${this.postBook?.bookMetaId}/${this.bookId}/section/${this.bookColumnSlug}`;
      }
      return `/journal/${this.postBook?.bookMetaId}/${this.bookId}/posts`;
    }
    if (this.bookColumnId) {
      return `/column/${this.bookColumnId}`;
    }
    if (this.category) {
      return `/category/${this.category}`;
    }
    if (this.tag) {
      return `/tag/${this.tag}`;
    }
    if (this.year) {
      return `/archive/${this.year}${this.month ? '/' + this.month : ''}`;
    }

    return '/posts';
  }

  get paginationParam(): Params {
    return {};
  }

  private get postBookName() {
    return this.bookService.getBookName(this.postBook, false);
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
    private readonly paginationService: PaginationService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly bookService: BookService
  ) {
    this.isMobile = this.userAgentService.isMobile;
  }

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

        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['post_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;

        this.bookId = p.get('bookId')?.trim() || '';
        this.bookColumnSlug = p.get('columnSlug')?.trim() || '';
        this.bookColumnId = p.get('columnId')?.trim() || '';
        this.category = p.get('category')?.trim() || '';
        this.tag = p.get('tag')?.trim() || '';
        this.year = p.get('year')?.trim() || '';
        this.month = p.get('month')?.trim() || '';

        this.isSection = !!this.bookId;

        const latestParam = JSON.stringify({
          page: this.page,
          bookId: this.bookId,
          bookColumnSlug: this.bookColumnSlug,
          bookColumnId: this.bookColumnId,
          category: this.category,
          tag: this.tag,
          year: this.year,
          month: this.month
        });
        if (latestParam === this.lastParam) {
          return;
        }
        this.lastParam = latestParam;

        if (this.year) {
          this.pageIndex = 'post-archive';
        } else {
          this.pageIndex = 'post-list';
        }

        this.updatePageIndex();
        if (this.bookId || this.bookColumnId) {
          this.getPostsByBookId();
        } else {
          this.getPosts();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getPosts() {
    const param: PostQueryParam = {
      page: this.page,
      size: this.pageSize
    };
    if (this.category) {
      param.category = this.category;
    }
    if (this.tag) {
      param.tag = this.tag;
    }
    if (this.year) {
      param.year = this.year;
      if (this.month) {
        param.month = this.month;
      }
    }

    this.postService
      .getPosts(param)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts = res.posts?.list || [];
        this.page = res.posts?.page || 1;
        this.total = res.posts?.total || 0;
        this.postBook = undefined;
        this.postBookColumn = undefined;

        const breadcrumbs = (res.breadcrumbs || []).map((item) => ({
          ...item,
          url: `/category/${item.slug}`
        }));
        this.initData(breadcrumbs);
      });
  }

  private getPostsByBookId() {
    this.postService
      .getPostsByBookId<PostList>({
        page: this.page,
        size: this.pageSize,
        bookId: this.bookId,
        bookColumnSlug: this.bookColumnSlug,
        bookColumnId: this.bookColumnId,
        simple: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts = res.posts?.list || [];
        this.page = res.posts?.page || 1;
        this.total = res.posts?.total || 0;
        this.postBook = res.book;
        this.postBookColumn = res.bookColumn;

        this.initData([]);
      });
  }

  private initData(breadcrumbs: BreadcrumbEntity[]) {
    this.paginationService.updatePagination({
      page: this.page,
      total: this.total,
      pageSize: this.pageSize,
      url: this.paginationUrl,
      param: this.paginationParam
    });
    this.updatePageInfo(breadcrumbs);
    this.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo(breadcrumbData: BreadcrumbEntity[]) {
    const titles: string[] = [this.appInfo.appName];
    const keywords: string[] = [...this.appInfo.keywords];
    let description = '';

    if (this.category && breadcrumbData.length > 0) {
      const label = breadcrumbData[breadcrumbData.length - 1].label;
      titles.unshift(label, '分类');
      keywords.unshift(label);

      description += `「${label}」`;
    } else if (this.tag) {
      titles.unshift(this.tag, '标签');
      keywords.unshift(this.tag);

      description += `「${this.tag}」`;
    } else if (this.year) {
      const label = `${this.year}年${this.month ? this.month + '月' : ''}`;
      titles.unshift(label, '归档', '期刊');
      description += label;
    } else if (this.postBook) {
      titles.unshift(this.postBook.bookName);
      if (this.postBook.bookIssue) {
        titles.unshift(this.postBook.bookIssue);
      }
      description += this.postBookName.fullName;
      keywords.unshift(this.postBook.bookName);

      if (this.postBookColumn) {
        titles.unshift(this.postBookColumn.bookColumnName);
        description += `「${this.postBookColumn.bookColumnName}」`;
        keywords.unshift(this.postBookColumn.bookColumnName);
      }
    }
    if (description) {
      description += '文章列表';
    }
    if (titles.length < 2) {
      titles.unshift('文章列表');
    }
    if (this.page > 1) {
      titles.unshift(`第${this.page}页`);
      if (description) {
        description += `(第${this.page}页)`;
      }
    }
    if (description) {
      description += '。';
    }
    description += this.appInfo.appDescription;

    this.metaService.updateHTMLMeta({
      title: titles.join(' - '),
      description,
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs(breadcrumbData: BreadcrumbEntity[]) {
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '期刊',
        tooltip: '期刊',
        url: '/posts',
        isHeader: false
      }
    ];
    if (this.tag) {
      breadcrumbs.push(
        {
          label: '标签',
          tooltip: '标签',
          url: '',
          isHeader: false
        },
        {
          label: this.tag,
          tooltip: this.tag,
          url: `/tag/${this.tag}`,
          isHeader: true
        }
      );
    } else if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: `归档`,
          url: `/archive`,
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: `/archive/${this.year}`,
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${Number(this.month)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    } else if (breadcrumbData.length > 0) {
      breadcrumbs = breadcrumbs.concat(breadcrumbData);
    } else if (this.postBook) {
      if (this.bookColumnId && this.postBookColumn) {
        breadcrumbs.push({
          label: '栏目',
          tooltip: '栏目',
          url: '',
          isHeader: false
        }, {
          label: `《${this.postBook.bookName}》: ${this.postBookColumn.bookColumnName}`,
          tooltip: `《${this.postBook.bookName}》: ${this.postBookColumn.bookColumnName}`,
          url: `/column/${this.postBookColumn.bookColumnId}`,
          isHeader: true
        });
      } else {
        breadcrumbs.push({
          label: this.postBook.bookName,
          tooltip: this.postBook.bookName,
          url: '',
          isHeader: false
        });
        if (this.postBook.bookIssue) {
          breadcrumbs.push({
            label: this.postBook.bookIssue,
            tooltip: this.postBook.bookIssue,
            url: `/journal/${this.postBook.bookMetaId}/${this.postBook.bookId}`,
            isHeader: !this.bookColumnSlug
          });
        }
        if (this.postBookColumn) {
          breadcrumbs.push({
            label: this.postBookColumn.bookColumnName,
            tooltip: this.postBookColumn.bookColumnName,
            url: `/journal/${this.postBook.bookMetaId}/${this.postBook.bookId}/section/${this.postBookColumn.bookColumnSlug}`,
            isHeader: true
          });
        }
      }
    }
    if (this.page > 1) {
      breadcrumbs.push({
        label: `第${this.page}页`,
        tooltip: `第${this.page}页`,
        url: '',
        isHeader: false
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
