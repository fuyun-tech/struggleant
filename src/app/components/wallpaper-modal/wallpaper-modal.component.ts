import { Component, computed, inject, input, OnChanges, output, signal } from '@angular/core';
import { environment } from 'env/environment';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { takeUntil } from 'rxjs';
import { Wallpaper } from '../../interfaces/wallpaper';
import { DestroyService } from '../../services/destroy.service';
import { WallpaperService } from '../../services/wallpaper.service';

@Component({
  selector: 'app-wallpaper-modal',
  imports: [NzModalModule, NzIconModule],
  providers: [DestroyService],
  templateUrl: './wallpaper-modal.component.html',
  styleUrl: './wallpaper-modal.component.less'
})
export class WallpaperModalComponent implements OnChanges {
  private readonly destroy$ = inject(DestroyService);
  private readonly wallpaperService = inject(WallpaperService);

  readonly visible = input(false);
  readonly close = output<void>();

  readonly loading = signal(false);
  readonly wallpapers = signal<Wallpaper[]>([]);
  readonly activeIndex = signal(0);
  readonly activeWallpaper = computed(() => this.wallpapers()[this.activeIndex()]);

  ngOnChanges(): void {
    if (this.visible() && this.wallpapers().length < 1) {
      this.getWallpapers();
    }
  }

  prevWallpaper() {
    this.activeIndex.set(this.activeIndex() < 2 ? 0 : this.activeIndex() - 1);
  }

  nextWallpaper() {
    const size = this.wallpapers().length;

    this.activeIndex.set(this.activeIndex() > size - 2 ? size - 1 : this.activeIndex() + 1);
  }

  gotoDetail() {
    const wallpaper = this.activeWallpaper();
    const lang = wallpaper.isCn ? '' : '&lang=en';

    window.open(`${environment.wallpaperHost}/detail/${wallpaper.id}?ref=sa_modal${lang}`);
  }

  gotoSearch() {
    window.open(this.activeWallpaper().copyrightUrl);
  }

  gotoWallpaper() {
    window.open(`${environment.wallpaperHost}/list?ref=sa_modal`);
  }

  closeModal() {
    this.close.emit();
  }

  private getWallpapers() {
    this.loading.set(true);

    this.wallpaperService
      .getRandomWallpapers(8)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.wallpapers.set(
          res.map((item) => {
            const loc = item.location ? '，' + item.location : ', ' + item.locationEn;
            const description = item.copyright + loc + ' (' + item.copyrightAuthor + ')';
            const enLink = item.copyrightUrlEn ? item.copyrightUrlEn + '&ensearch=1' : '';
            return {
              ...item,
              title: item.title || item.titleEn,
              copyrightUrl: `https://cn.bing.com${item.copyrightUrl || enLink}`,
              description: description
            };
          })
        );
        this.activeIndex.set(0);
        this.loading.set(false);
      });
  }
}
