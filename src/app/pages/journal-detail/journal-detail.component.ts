import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { BookEntity } from 'src/app/interfaces/book';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { OptionEntity } from 'src/app/interfaces/option';
import { PostCatalog } from 'src/app/interfaces/post';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';
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
  imports: [NgIf, NgFor, RouterLink, BreadcrumbComponent, MakeMoneyComponent],
  providers: [DestroyService],
  templateUrl: './journal-detail.component.html',
  styleUrl: './journal-detail.component.less'
})
export class JournalDetailComponent implements OnInit {
  isMobile = false;
  book!: BookEntity;
  catalogs: PostCatalog[] = [];

  protected pageIndex = 'journal-detail';

  private appInfo!: TenantAppModel;
  private options: OptionEntity = {};
  private bookId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly destroy$: DestroyService,
    private readonly userAgentService: UserAgentService,
    private readonly commonService: CommonService,
    private readonly metaService: MetaService,
    private readonly breadcrumbService: BreadcrumbService,
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
      this.route.paramMap
    ])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options]) => {
        const { paramMap: p } = this.route.snapshot;

        this.appInfo = appInfo;
        this.options = options;

        this.bookId = p.get('bookId')?.trim() || '';
        if (!this.bookId) {
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
      .getBookById(this.bookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.book = res || {};

        if (!res || !res.bookId) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.initData();
      });
  }

  private getPostsWithColumn() {
    this.postService
      .getPostsWithColumn(this.bookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const posts = (res || []).sort((a, b) => a.postCreated > b.postCreated ? 1 : -1);
        const catalogMap: Record<string, PostCatalog> = {};

        posts.forEach(post => {
          if (post.bookColumn) {
            if (catalogMap[post.bookColumn.bookColumnId]) {
              catalogMap[post.bookColumn.bookColumnId].posts.push({
                postId: post.postId,
                postTitle: post.postTitle,
                postGuid: post.postGuid,
                postCreated: post.postCreated
              });
            } else {
              catalogMap[post.bookColumn.bookColumnId] = {
                ...post.bookColumn,
                posts: [{
                  postId: post.postId,
                  postTitle: post.postTitle,
                  postGuid: post.postGuid,
                  postCreated: post.postCreated
                }]
              };
            }
          } else {
            if (catalogMap['other']) {
              catalogMap['other'].posts.push({
                postId: post.postId,
                postTitle: post.postTitle,
                postGuid: post.postGuid,
                postCreated: post.postCreated
              });
            } else {
              catalogMap['other'] = {
                bookColumnId: '',
                bookColumnName: '其它',
                bookColumnSlug: 'others',
                bookColumnOrder: 999,
                posts: [{
                  postId: post.postId,
                  postTitle: post.postTitle,
                  postGuid: post.postGuid,
                  postCreated: post.postCreated
                }]
              };
            }
          }
        });

        this.catalogs = Object.values(catalogMap).sort((a, b) => a.bookColumnOrder > b.bookColumnOrder ? 1 : -1);
      });
  }

  private initData() {
    this.updatePageInfo();
    this.updateBreadcrumbs();
  }

  private updatePageInfo() {
    const titles: string[] = [this.book.bookName, this.appInfo.appName];
    const keywords: string[] = [this.book.bookName, ...this.appInfo.keywords];
    let description = this.book.bookName;

    if (this.book.bookIssue) {
      titles.unshift(this.book.bookIssue);
      description += this.book.bookIssue + '。';
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

  private updateBreadcrumbs() {
    let breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '期刊',
        tooltip: '期刊',
        url: '/posts',
        isHeader: false
      }
    ];
    breadcrumbs.push({
      label: this.book.bookName,
      tooltip: this.book.bookName,
      url: '',
      isHeader: !this.book.bookIssue
    });
    if (this.book.bookIssue) {
      breadcrumbs.push({
        label: this.book.bookIssue,
        tooltip: this.book.bookIssue,
        url: `/journal/${this.book.bookMetaId}/${this.book.bookId}`,
        isHeader: true
      });
    }

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }
}
