import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isEmpty, uniq } from 'lodash';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyComponent } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { combineLatest, skipWhile, takeUntil } from 'rxjs';
import { CarouselComponent } from 'src/app/components/carousel/carousel.component';
import { PostItemComponent } from 'src/app/components/post-item/post-item.component';
import { IconCalendarDateComponent } from 'src/app/icons/icon-calendar-date.component';
import { IconChatSquareDotsComponent } from 'src/app/icons/icon-chat-square-dots.component';
import { IconChatSquareComponent } from 'src/app/icons/icon-chat-square.component';
import { OptionEntity } from 'src/app/interfaces/option';
import { PostEntity, PostModel, PostVo } from 'src/app/interfaces/post';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { NumberViewPipe } from 'src/app/pipes/number-view.pipe';
import { BreadcrumbService } from 'src/app/services/breadcrumb.service';
import { CommonService } from 'src/app/services/common.service';
import { DestroyService } from 'src/app/services/destroy.service';
import { MetaService } from 'src/app/services/meta.service';
import { OptionService } from 'src/app/services/option.service';
import { PostService } from 'src/app/services/post.service';
import { TenantAppService } from 'src/app/services/tenant-app.service';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    DatePipe,
    NzButtonModule,
    NzIconModule,
    NzEmptyComponent,
    CarouselComponent,
    NumberViewPipe,
    PostItemComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent,
    IconCalendarDateComponent
  ],
  providers: [DestroyService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.less'
})
export class HomeComponent implements OnInit {
  private readonly destroy$ = inject(DestroyService);
  private readonly uaService = inject(UserAgentService);
  private readonly commonService = inject(CommonService);
  private readonly metaService = inject(MetaService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly tenantAppService = inject(TenantAppService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);

  readonly isMobile = this.uaService.isMobile;
  readonly hotPosts = signal<PostEntity[]>([]);
  readonly latestPosts = signal<PostVo[]>([]);
  readonly randomPosts = signal<PostModel[]>([]);

  protected readonly pageIndex = 'index';

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
        this.getLatestPosts();
        if (!this.isMobile) {
          this.getHotPosts();
          this.getRandomPosts();
        }
      });
  }

  protected updatePageIndex(): void {
    this.commonService.updatePageIndex(this.pageIndex);
  }

  private getLatestPosts() {
    this.postService
      .getLatestPosts(this.isMobile ? 10 : 8)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.latestPosts.set(res || []);
      });
  }

  private getRandomPosts() {
    this.postService
      .getRandomPosts(8, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomPosts.set(res || []);
      });
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts.set(res);
      });
  }

  private updatePageInfo() {
    const appInfo = this.appInfo()!;
    const titles = [appInfo.slogan || '首页', appInfo.name];
    const description = appInfo.description;
    const keywords: string[] = [...appInfo.keywordList];

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
    this.breadcrumbService.updateBreadcrumbs([]);
  }
}
