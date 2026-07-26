import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from 'env/environment';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { skipWhile, takeUntil } from 'rxjs';
import { IconCalendarDateComponent } from 'src/app/icons/icon-calendar-date.component';
import { BookVo } from '../../interfaces/book';
import { ArchiveData, PageIndexInfo } from '../../interfaces/common';
import { OptionEntity } from '../../interfaces/option';
import { PostEntity, PostVo } from '../../interfaces/post';
import { BookService } from '../../services/book.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { PostService } from '../../services/post.service';
import { AdsenseComponent } from '../adsense/adsense.component';

@Component({
  selector: 'app-sider',
  imports: [RouterLink, NzIconModule, AdsenseComponent, IconCalendarDateComponent],
  providers: [DestroyService],
  templateUrl: './sider.component.html',
  styleUrl: './sider.component.less'
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = inject(DestroyService);
  private readonly platform = inject(PlatformService);
  private readonly commonService = inject(CommonService);
  private readonly optionService = inject(OptionService);
  private readonly postService = inject(PostService);
  private readonly bookService = inject(BookService);

  readonly siderEle = viewChild<ElementRef<HTMLElement>>('siderEle');

  readonly adsPlaceholder = true;
  readonly indexInfo = signal<PageIndexInfo | null>(null);
  readonly hotPosts = signal<PostEntity[]>([]);
  readonly randomPosts = signal<PostEntity[]>([]);
  readonly postArchives = signal<ArchiveData[]>([]);
  readonly bookPosts = signal<PostVo[]>([]);
  readonly activeBook = signal<BookVo | null>(null);
  readonly bookName = computed(() => {
    return this.bookService.getBookName(this.activeBook()!).fullName;
  });
  readonly adsVisible = computed(() => {
    const options = this.options();

    return (
      (environment.production && ['1', '0'].includes(options['ads_flag'])) ||
      (!environment.production && ['2', '0'].includes(options['ads_flag']))
    );
  });

  private readonly options = signal<OptionEntity>({});
  private readonly pageIndex = signal('');

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options.set(options);
      });
    this.commonService.pageIndex$
      .pipe(
        skipWhile((pageIndex) => !pageIndex),
        takeUntil(this.destroy$)
      )
      .subscribe((pageIndex) => {
        if (this.pageIndex() !== pageIndex) {
          const indexInfo = this.commonService.getPageIndexInfo(pageIndex);

          this.pageIndex.set(pageIndex);
          this.indexInfo.set(indexInfo);

          this.getHotPosts();
          this.getPostArchives();
          this.getRandomPosts();
        }
      });
    this.postService.activeBook$.pipe(takeUntil(this.destroy$)).subscribe((book) => {
      this.activeBook.set(book || null);
      if (book) {
        this.getPostsByBookId();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler);
      window.addEventListener('resize', this.scrollHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.platform.isBrowser) {
      window.removeEventListener('scroll', this.scrollHandler);
      window.removeEventListener('resize', this.scrollHandler);
    }
  }

  private getPostsByBookId() {
    this.postService
      .getPostsByBookId({
        page: 1,
        size: 10,
        bookId: this.activeBook()?.id,
        simple: 1
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.bookPosts.set(res.posts.list || []);
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

  private getRandomPosts() {
    this.postService
      .getRandomPosts(10, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomPosts.set(res);
      });
  }

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postArchives.set(res);
      });
  }

  private scrollHandler = () => {
    const docEle = document.documentElement;
    const siderEle = this.siderEle();

    if (siderEle && docEle.scrollTop > 0) {
      if (docEle.scrollTop > siderEle.nativeElement.scrollHeight - docEle.clientHeight) {
        siderEle.nativeElement.style.position = 'sticky';
        if (siderEle.nativeElement.scrollHeight < docEle.clientHeight) {
          siderEle.nativeElement.style.top = '0';
        } else {
          siderEle.nativeElement.style.top = docEle.clientHeight - siderEle.nativeElement.scrollHeight - 16 + 'px';
        }
      } else {
        siderEle.nativeElement.style.position = 'relative';
        siderEle.nativeElement.style.top = '';
      }
    }
  };
}
