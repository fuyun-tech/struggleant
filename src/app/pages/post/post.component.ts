import { DatePipe, NgStyle } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageService } from 'ng-zorro-antd/image';
import { ClipboardService } from 'ngx-clipboard';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from 'src/app/components/breadcrumb/breadcrumb.component';
import { CommentComponent } from 'src/app/components/comment/comment.component';
import { MakeMoneyComponent } from 'src/app/components/make-money/make-money.component';
import { PostPrevNextComponent } from 'src/app/components/post-prev-next/post-prev-next.component';
import { PostRelatedComponent } from 'src/app/components/post-related/post-related.component';
import { ShareModalComponent } from 'src/app/components/share-modal/share-modal.component';
import { REGEXP_ID } from 'src/app/config/common.constant';
import { Message } from 'src/app/config/message.enum';
import { ResponseCode } from 'src/app/config/response-code.enum';
import { CommentTargetType } from 'src/app/enums/comment';
import { FavoriteType } from 'src/app/enums/favorite';
import { LogActionType, LogTargetType } from 'src/app/enums/log';
import { ContentType } from 'src/app/enums/post';
import { VoteType, VoteValue } from 'src/app/enums/vote';
import { IconCalendarDateComponent } from 'src/app/icons/icon-calendar-date.component';
import { IconLockComponent } from 'src/app/icons/icon-lock.component';
import { IconShareFillComponent } from 'src/app/icons/icon-share-fill.component';
import { BookVo } from 'src/app/interfaces/book';
import { BookColumnEntity } from 'src/app/interfaces/book-column';
import { BreadcrumbEntity } from 'src/app/interfaces/breadcrumb';
import { OptionEntity } from 'src/app/interfaces/option';
import { PostCategoryVo, PostModel, PostTagVo, PostVo } from 'src/app/interfaces/post';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { UserModel } from 'src/app/interfaces/user';
import { LicenseLinkPipe } from 'src/app/pipes/license-link.pipe';
import { LicensePipe } from 'src/app/pipes/license.pipe';
import { NumberViewPipe } from 'src/app/pipes/number-view.pipe';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { BookService } from 'src/app/services/book.service';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommentService } from 'src/app/services/comment.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { LogService } from 'src/app/services/log.service';
import { MessageService } from 'src/app/services/message.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PlatformService } from 'src/app/services/platform.service';
import { PostService } from 'src/app/services/post.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';
import { UserService } from 'src/app/services/user.service';
import { VoteService } from 'src/app/services/vote.service';
import { decodeEntities } from 'src/app/utils/entities';

@Component({
  selector: 'app-post',
  imports: [
    NgStyle,
    RouterLink,
    DatePipe,
    NzIconModule,
    SafeHtmlPipe,
    NumberViewPipe,
    LicensePipe,
    LicenseLinkPipe,
    BreadcrumbComponent,
    PostPrevNextComponent,
    PostRelatedComponent,
    CommentComponent,
    ShareModalComponent,
    MakeMoneyComponent,
    IconCalendarDateComponent,
    IconLockComponent,
    IconShareFillComponent
  ],
  providers: [DestroyService, NzImageService],
  templateUrl: './post.component.html'
})
export class PostComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly route = inject(ActivatedRoute);
  private readonly platform = inject(PlatformService);
  private readonly uaService = inject(UserAgentService);
  private readonly message = inject(MessageService);
  private readonly imageService = inject(NzImageService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly userService = inject(UserService);
  private readonly postService = inject(PostService);
  private readonly voteService = inject(VoteService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly commentService = inject(CommentService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly logService = inject(LogService);
  private readonly bookService = inject(BookService);

  readonly contentType = input<ContentType>(ContentType.POST);

  readonly commentType = computed(() => {
    return this.contentType() === ContentType.POST ? CommentTargetType.POST : CommentTargetType.PAGE;
  });
  readonly isMobile = this.uaService.isMobile;
  readonly isArticle = this.contentType() === ContentType.POST;
  readonly isSignIn = signal(false);
  readonly post = signal<PostModel | null>(null);
  readonly postMeta = signal<Record<string, any>>({});
  readonly postCategories = signal<PostCategoryVo[]>([]);
  readonly postTags = signal<PostTagVo[]>([]);
  readonly postBookColumn = signal<BookColumnEntity | null>(null);
  readonly isFavorite = signal(false);
  readonly isVoted = signal(false);
  readonly voteLoading = signal(false);
  readonly favoriteLoading = signal(false);
  readonly shareVisible = signal(false);
  readonly shareUrl = signal('');
  readonly showPayMask = computed(() => {
    const post = this.post();
    const user = this.user();

    if (!post) {
      return false;
    }

    return (
      (post.isPaid && (!user || (!user.isAdmin && post.creatorId !== user.id))) ||
      (post.visibility === 3 && !this.isSignIn())
    );
  });

  protected readonly pageIndex = signal('post-detail');

  private readonly copyHTML = `<span class="fi"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg></span>`;
  private readonly copiedHTML = `<span class="fi"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg></span>`;

  private readonly appInfo = signal<TenantAppVo | null>(null);
  private readonly options = signal<OptionEntity>({});
  private readonly user = signal<UserModel | null>(null);
  private readonly postId = signal('');
  private readonly postSlug = signal('');
  private readonly referrer = signal('');
  private readonly postBook = signal<BookVo | null>(null);
  private readonly codeList = signal<string[]>([]);

  ngOnInit(): void {
    combineLatest([this.tenantAppService.appInfo$, this.optionService.options$, this.route.paramMap])
      .pipe(
        skipWhile(([appInfo, options]) => isEmpty(appInfo) || isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe(([appInfo, options, p]) => {
        this.appInfo.set(appInfo);
        this.options.set(options);
        this.referrer.set(this.commonService.getReferrer(true));

        const slug = p.get('slug')?.trim() || '';
        if (!slug) {
          this.commonService.redirectToNotFound();
          return;
        }

        this.closeShareQrcode();

        if (REGEXP_ID.test(slug)) {
          this.postId.set(slug);
          this.getPost();
          this.commentService.updateTargetId(slug);
        } else {
          this.postSlug.set(slug);
          this.getPage();
        }
      });
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user.set(user);
      this.isSignIn.set(!!user.id);

      if (this.platform.isBrowser) {
        this.shareUrl.set(this.commonService.getShareURL(user.id));
      }
    });
  }

  onPostClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;

    if ($target.classList.contains('i-code-copy')) {
      e.preventDefault();
      e.stopPropagation();

      if (!this.isSignIn()) {
        this.showSigninModal();
        return;
      }
      const index = Number($target.dataset['i']);
      const codeText = this.codeList()[index];
      if (codeText) {
        this.clipboardService.copy(decodeEntities(codeText));
        $target.innerHTML = this.copiedHTML;

        window.setTimeout(() => {
          $target.innerHTML = this.copyHTML;
        }, 2000);

        this.logService
          .logAction({
            action: LogActionType.COPY_CODE,
            targetType: LogTargetType.POST,
            targetId: this.post()!.id,
            index: index + 1
          })
          .pipe(takeUntil(this.destroy$))
          .subscribe();
      }
    } else if ($target instanceof HTMLImageElement) {
      e.preventDefault();
      e.stopPropagation();

      this.imageService.preview([
        {
          src: $target.src
        }
      ]);
    }
  }

  onPostSelect() {
    const post = this.post();

    if (!post) {
      return true;
    }

    return !post.isPaid && (post.visibility !== 3 || this.isSignIn());
  }

  vote() {
    if (this.voteLoading() || this.isVoted()) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    const post = this.post();
    if (!post) {
      return;
    }
    this.voteService
      .saveVote({
        targetId: post.id,
        value: VoteValue.LIKE,
        type: this.contentType() === ContentType.PAGE ? VoteType.PAGE : VoteType.POST
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.voteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS) {
          this.message.success(Message.VOTE_SUCCESS);
          this.isVoted.set(true);
          this.post.update((data) => {
            return data
              ? {
                  ...data,
                  postStat: {
                    ...data.postStat,
                    likeCount: res.data.likeCount
                  }
                }
              : null;
          });
        }
      });
  }

  showReward() {
    const previewRef = this.imageService.preview([
      {
        src: '/assets/images/reward.jpg'
      }
    ]);
    this.commonService.paddingPreview(previewRef.previewInstance.imagePreviewWrapper);
  }

  addFavorite() {
    if (this.favoriteLoading() || this.isFavorite()) {
      return;
    }
    if (!this.isSignIn()) {
      this.showSigninModal();
      return;
    }
    this.favoriteLoading.set(true);
    this.favoriteService
      .addFavorite(this.postId(), FavoriteType.POST)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.favoriteLoading.set(false);

        if (res.code === ResponseCode.SUCCESS || res.code === ResponseCode.FAVORITE_IS_EXIST) {
          this.message.success(Message.ADD_FAVORITE_SUCCESS);
          this.isFavorite.set(true);
        }
      });
  }

  showShareQrcode() {
    this.shareVisible.set(true);
  }

  closeShareQrcode() {
    this.shareVisible.set(false);
  }

  showSigninModal() {
    this.commonService.updateSigninOptions({
      visible: true,
      closable: true
    });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex());
  }

  private getPost(): void {
    this.postService
      .getPostById(this.postId(), this.contentType(), this.referrer())
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (!post) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.initData(post);
      });
  }

  private getPage(): void {
    this.postService
      .getPostBySlug(this.postSlug(), this.contentType(), this.referrer())
      .pipe(takeUntil(this.destroy$))
      .subscribe((post) => {
        if (!post) {
          this.commonService.redirectToNotFound();
          return;
        }
        this.initData(post);
        this.commentService.updateTargetId(post.id);
      });
  }

  private initData(post: PostVo) {
    const result = this.postService.parseHTML(post.content, this.copyHTML);

    this.post.set({
      ...post,
      content: result.content,
      source: this.postService.getPostSource(post)
    });
    this.postBook.set(post.book || null);
    this.postBookColumn.set(post.bookColumn || null);
    this.codeList.set(result.codeList);
    this.postMeta.set(post.metadata);
    this.postCategories.set(post.categories);
    this.postTags.set(post.tags);
    this.isFavorite.set(post.isFavorite);
    this.isVoted.set(post.isVoted);
    this.pageIndex.set(this.isArticle ? 'post-detail' : 'page-' + post.slug);

    this.postService.updateActivePostId(post.id);
    this.postService.updateActivePost(post);
    this.postService.updateActiveBook(post.book);
    this.updateBreadcrumbs();
    this.updatePageIndex();
    this.updatePageInfo();
  }

  private updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbEntity[] = [
      {
        label: '期刊',
        tooltip: '期刊文章列表',
        url: '/posts',
        isHeader: false
      }
    ];
    const postBook = this.postBook();
    const postBookColumn = this.postBookColumn();

    if (postBook) {
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
          isHeader: !postBookColumn
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

    this.breadcrumbService.updateBreadcrumbs(breadcrumbs);
  }

  private updatePageInfo() {
    const titles: string[] = [this.appInfo()?.name || ''];
    const keywords: string[] = this.postTags().map((item) => item.tag.name);
    const postBook = this.postBook();

    if (postBook) {
      titles.unshift(postBook.bookMeta.name);
      if (postBook.issue) {
        titles.unshift(postBook.issue);
      }
      keywords.unshift(postBook.bookMeta.name);
    }
    titles.unshift(this.post()?.title || '');

    this.metaService.updateHTMLMeta({
      title: titles.filter((item) => !!item).join(' - '),
      description: this.post()?.summary || '',
      keywords: uniq(keywords)
        .filter((item) => !!item)
        .join(','),
      author: this.options()['site_author']
    });
  }
}
