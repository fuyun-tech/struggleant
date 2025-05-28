import { Injectable } from '@angular/core';
import { environment } from 'env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { ResultList } from '../interfaces/common';
import { HotWallpaper, Wallpaper, WallpaperQueryParam } from '../interfaces/wallpaper';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  constructor(private readonly apiService: ApiService) {}

  getWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPERS, {
        ...param,
        appId: APP_ID
      })
      .pipe(
        map((res) => {
          if (!res?.data) {
            return {};
          }
          return {
            ...res.data,
            list: res.data.list.map((item: Wallpaper) => this.transformWallpaper(item))
          };
        })
      );
  }

  getHotWallpapers(size: number): Observable<HotWallpaper[]> {
    return this.apiService
      .httpGet(ApiUrl.WALLPAPER_HOT, {
        size,
        appId: APP_ID
      })
      .pipe(
        map((res) => {
          return (res?.data || []).map((item: HotWallpaper) => {
            return {
              ...item,
              wallpaperTitle: item.wallpaperTitleCn || item.wallpaperTitleEn,
              wallpaperCopyright: item.wallpaperCopyrightCn || item.wallpaperCopyrightEn,
              isCn: !!item.wallpaperCopyrightCn,
              isEn: !!item.wallpaperCopyrightEn
            };
          });
        })
      );
  }

  getRandomWallpapers(size: number, simple?: boolean, resolution?: string): Observable<Wallpaper[]> {
    const payload: Record<string, any> = {
      size,
      simple: simple ? 1 : 0,
      appId: APP_ID
    };
    if (resolution) {
      payload['resolution'] = resolution;
    }

    return this.apiService.httpGet(ApiUrl.WALLPAPER_RANDOM, payload).pipe(
      map((res) => {
        return (res?.data || []).map((item: Wallpaper) => {
          return {
            ...item,
            wallpaperTitle: item.wallpaperTitle || item.wallpaperTitleEn,
            wallpaperCopyright: item.wallpaperCopyright || item.wallpaperCopyrightEn,
            isCn: !!item.wallpaperCopyright,
            isEn: !!item.wallpaperCopyrightEn
          };
        });
      })
    );
  }

  transformWallpaper(wallpaper: Wallpaper): Wallpaper {
    return {
      ...wallpaper,
      wallpaperCopyright: wallpaper.wallpaperCopyright || wallpaper.wallpaperCopyrightEn,
      wallpaperCopyrightEn: wallpaper.wallpaperCopyrightEn || wallpaper.wallpaperCopyright,
      wallpaperLocation: wallpaper.wallpaperLocation || wallpaper.wallpaperLocationEn || '未知',
      wallpaperLocationEn: wallpaper.wallpaperLocationEn || wallpaper.wallpaperLocation || 'Unknown',
      wallpaperStory: wallpaper.wallpaperStory || wallpaper.wallpaperStoryEn,
      wallpaperStoryEn: wallpaper.wallpaperStoryEn || wallpaper.wallpaperStory,
      isCn: !!wallpaper.wallpaperCopyright,
      isEn: !!wallpaper.wallpaperCopyrightEn
    };
  }

  getWallpaperLink(wallpaperId: string, isEn: boolean) {
    return `${environment.wallpaperHost}/detail/${wallpaperId}${isEn ? '?lang=en' : ''}`;
  }
}
