import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from 'env/environment';
import { isEmpty } from 'lodash';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { skipWhile, takeUntil } from 'rxjs';
import { BookEntity } from '../../interfaces/book';
import { ArchiveData, PageIndexInfo } from '../../interfaces/common';
import { OptionEntity } from '../../interfaces/option';
import { PostEntity } from '../../interfaces/post';
import { BookService } from '../../services/book.service';
import { CommonService } from '../../services/common.service';
import { DestroyService } from '../../services/destroy.service';
import { OptionService } from '../../services/option.service';
import { PlatformService } from '../../services/platform.service';
import { PostService } from '../../services/post.service';
import { AdsenseComponent } from '../adsense/adsense.component';

@Component({
  selector: 'app-sider',
  imports: [RouterLink, NzIconModule, AdsenseComponent],
  providers: [DestroyService],
  templateUrl: './sider.component.html',
  styleUrl: './sider.component.less'
})
export class SiderComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('siderEle') siderEle!: ElementRef;

  readonly adsPlaceholder = true;

  indexInfo?: PageIndexInfo;
  hotPosts: PostEntity[] = [];
  randomPosts: PostEntity[] = [];
  postArchives: ArchiveData[] = [];
  bookPosts: PostEntity[] = [];
  activeBook?: BookEntity;

  get bookName() {
    return this.bookService.getBookName(this.activeBook).fullName;
  }

  get adsVisible() {
    return (
      (environment.production && ['1', '0'].includes(this.options['ads_flag'])) ||
      (!environment.production && ['2', '0'].includes(this.options['ads_flag']))
    );
  }

  private options: OptionEntity = {};
  private pageIndex = '';

  constructor(
    private readonly destroy$: DestroyService,
    private readonly platform: PlatformService,
    private readonly commonService: CommonService,
    private readonly optionService: OptionService,
    private readonly postService: PostService,
    private readonly bookService: BookService
  ) {}

  ngOnInit(): void {
    this.optionService.options$
      .pipe(
        skipWhile((options) => isEmpty(options)),
        takeUntil(this.destroy$)
      )
      .subscribe((options) => {
        this.options = options;
      });
    this.commonService.pageIndex$
      .pipe(
        skipWhile((page) => !page),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        if (this.pageIndex !== page) {
          this.pageIndex = page;
          this.indexInfo = this.commonService.getPageIndexInfo(page);

          this.getHotPosts();
          this.getPostArchives();
          this.getRandomPosts();
        }
      });
    this.postService.activeBook$.pipe(takeUntil(this.destroy$)).subscribe((book) => {
      this.activeBook = book;
      if (book) {
        this.getPostsByBookId();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      window.addEventListener('scroll', this.scrollHandler.bind(this));
      window.addEventListener('resize', this.scrollHandler.bind(this));
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
      .getPostsByBookId<{ posts: PostEntity[] }>({
        page: 1,
        size: 10,
        bookId: this.activeBook?.bookId,
        simple: 1
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.bookPosts = res.posts || [];
      });
  }

  private getHotPosts() {
    this.postService
      .getHotPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.hotPosts = res;
      });
  }

  private getRandomPosts() {
    this.postService
      .getRandomPosts(10, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.randomPosts = res;
      });
  }

  private getPostArchives() {
    this.postService
      .getPostArchives(true, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.postArchives = res;
      });
  }

  private scrollHandler() {
    const docEle = document.documentElement;
    if (this.siderEle && docEle.scrollTop > 0) {
      if (docEle.scrollTop > this.siderEle.nativeElement.scrollHeight - docEle.clientHeight) {
        this.siderEle.nativeElement.style.position = 'sticky';
        if (this.siderEle.nativeElement.scrollHeight < docEle.clientHeight) {
          this.siderEle.nativeElement.style.top = 0;
        } else {
          this.siderEle.nativeElement.style.top =
            docEle.clientHeight - this.siderEle.nativeElement.scrollHeight - 16 + 'px';
        }
      } else {
        this.siderEle.nativeElement.style.position = 'relative';
        this.siderEle.nativeElement.style.top = '';
      }
    }
  }
}
