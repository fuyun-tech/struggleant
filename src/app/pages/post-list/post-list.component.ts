import { NgForOf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../../components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from '../../components/make-money/make-money.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { PostItemComponent } from '../../components/post-item/post-item.component';
import { BookEntity } from '../../interfaces/book';
import { BreadcrumbEntity } from '../../interfaces/breadcrumb';
import { OptionEntity } from '../../interfaces/option';
import { Post, PostList, PostQueryParam } from '../../interfaces/post';
import { TenantAppModel } from '../../interfaces/tenant-app';
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
  imports: [NgForOf, NzEmptyModule, BreadcrumbComponent, PaginationComponent, PostItemComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.less'
})
export class PostListComponent implements OnInit {
  isMobile = false;
  page = 1;
  pageSize = 10;
  total = 0;
  keyword = '';
  category = '';
  tag = '';
  posts: Post[] = [];

  protected pageIndex = 'post-list';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private year = '';
  private month = '';
  private bookId = '';
  private book?: BookEntity;

  get paginationUrl() {
    if (this.category) {
      return `/post/category/${this.category}`;
    }
    if (this.tag) {
      return `/post/tag/${this.tag}`;
    }
    if (this.year) {
      return `/post/archive/${this.year}${this.month ? '/' + this.month : ''}`;
    }

    return '/post';
  }

  get paginationParam(): Params {
    if (this.keyword) {
      return { keyword: this.keyword };
    }

    return {};
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
    private readonly postService: PostService
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
      .subscribe(([appInfo, options, p, qp]) => {
        this.appInfo = appInfo;
        this.options = options;

        this.pageSize = Number(this.options['post_page_size']) || 10;
        this.page = Number(qp.get('page')) || 1;
        this.keyword = qp.get('keyword')?.trim() || '';
        this.bookId = qp.get('bookId')?.trim() || '';

        this.category = p.get('category')?.trim() || '';
        this.tag = p.get('tag')?.trim() || '';
        this.year = p.get('year')?.trim() || '';
        this.month = p.get('month')?.trim() || '';

        if (this.year) {
          this.pageIndex = 'post-archive';
        } else {
          this.pageIndex = 'post-list';
        }

        this.updatePageIndex();
        if (this.bookId) {
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
      pageSize: this.pageSize
    };
    if (this.keyword) {
      param.keyword = this.keyword;
    }
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
        this.book = undefined;

        this.initData(
          (res.breadcrumbs || []).map((item) => ({
            ...item,
            url: `/post/category/${item.slug}`
          }))
        );
      });
  }

  private getPostsByBookId() {
    this.postService
      .getPostsByBookId<PostList>({
        page: this.page,
        pageSize: this.pageSize,
        bookId: this.bookId,
        simple: 0
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.posts = res.posts.list || [];
        this.page = res.posts.page || 1;
        this.total = res.posts.total || 0;
        this.book = res.book;

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

  private updatePageInfo(postBreadcrumbs: BreadcrumbEntity[]) {
    const titles: string[] = ['期刊', this.appInfo.appName];
    const categories: string[] = [];
    const keywords: string[] = (this.options['post_keywords'] || '').split(',');
    let description = '';

    if (this.category && postBreadcrumbs.length > 0) {
      const label = postBreadcrumbs[postBreadcrumbs.length - 1].label;
      titles.unshift(label);
      categories.push(label);
      keywords.unshift(label);
    }
    if (this.tag) {
      titles.unshift(this.tag);
      categories.push(this.tag);
      keywords.unshift(this.tag);
    }
    description += categories.length > 0 ? `「${categories.join('-')}」` : '';
    if (this.year) {
      const label = `${this.year}年${this.month ? this.month + '月' : ''}`;
      titles.unshift(label);
      description += label;
    }
    if (this.keyword) {
      titles.unshift(this.keyword, '搜索');
      description += `「${this.keyword}」期刊搜索结果`;
      keywords.unshift(this.keyword);
    } else {
      if (description) {
        description += '期刊文章列表';
      }
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
      keywords: uniq(keywords).join(','),
      author: this.options['site_author']
    });
  }

  private updateBreadcrumbs(postBreadcrumbs: BreadcrumbEntity[]) {
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '期刊',
        tooltip: `期刊文章列表`,
        url: '/post',
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
          url: `/post/tag/${this.tag}`,
          isHeader: true
        }
      );
    }
    if (this.year) {
      breadcrumbs.push(
        {
          label: '归档',
          tooltip: `期刊归档`,
          url: `/post/archive`,
          isHeader: false
        },
        {
          label: `${this.year}年`,
          tooltip: `${this.year}年`,
          url: `/post/archive/${this.year}`,
          isHeader: !this.month
        }
      );
      if (this.month) {
        breadcrumbs.push({
          label: `${Number(this.month)}月`,
          tooltip: `${this.year}年${this.month}月`,
          url: `/post/archive/${this.year}/${this.month}`,
          isHeader: true
        });
      }
    }
    if (postBreadcrumbs.length > 0) {
      breadcrumbs = breadcrumbs.concat(postBreadcrumbs);
    }
    if (this.keyword) {
      breadcrumbs.push(
        {
          label: `搜索`,
          tooltip: `期刊搜索`,
          url: '',
          isHeader: false
        },
        {
          label: this.keyword,
          tooltip: this.keyword,
          url: '/post',
          param: {
            keyword: this.keyword
          },
          isHeader: true
        }
      );
    }
    if (this.book) {
      breadcrumbs.push({
        label: `${this.book.bookName}（${this.book.bookIssueNumber}）`,
        tooltip: `${this.book.bookName}（${this.book.bookIssueNumber}）`,
        url: '/post',
        param: {
          bookId: this.bookId
        },
        isHeader: true
      });
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
