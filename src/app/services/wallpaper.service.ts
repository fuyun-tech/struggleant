import { Injectable } from '@angular/core';
import { environment } from 'env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { ResultList } from '../interfaces/common';
import { HotWallpaper, Wallpaper, WallpaperQueryParam } from '../interfaces/wallpaper';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WallpaperService {
  constructor(private readonly apiService: ApiService) {}

  getWallpapers(param: WallpaperQueryParam): Observable<ResultList<Wallpaper>> {
    return this.apiService.httpGet(ApiUrl.WALLPAPERS, param).pipe(
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
        size
      })
      .pipe(
        map((res) => {
          return (res?.data || []).map((item: HotWallpaper) => {
            return {
              ...item,
              title: item.titleCn || item.titleEn,
              copyright: item.copyrightCn || item.copyrightEn,
              isCn: !!item.copyrightCn,
              isEn: !!item.copyrightEn
            };
          });
        })
      );
  }

  getRandomWallpapers(size: number, simple?: boolean, resolution?: string): Observable<Wallpaper[]> {
    const payload: Record<string, any> = {
      size,
      simple: simple ? 1 : 0
    };
    if (resolution) {
      payload['resolution'] = resolution;
    }

    return this.apiService.httpGet(ApiUrl.WALLPAPER_RANDOM, payload).pipe(
      map((res) => {
        return (res?.data || []).map((item: Wallpaper) => {
          return {
            ...item,
            title: item.title || item.titleEn,
            copyright: item.copyright || item.copyrightEn,
            isCn: !!item.copyright,
            isEn: !!item.copyrightEn
          };
        });
      })
    );
  }

  transformWallpaper(wallpaper: Wallpaper): Wallpaper {
    return {
      ...wallpaper,
      title: wallpaper.title || wallpaper.titleEn,
      titleEn: wallpaper.titleEn || wallpaper.title,
      copyright: wallpaper.copyright || wallpaper.copyrightEn,
      copyrightEn: wallpaper.copyrightEn || wallpaper.copyright,
      location: wallpaper.location || wallpaper.locationEn || '未知',
      locationEn: wallpaper.locationEn || wallpaper.location || 'Unknown',
      storyTitle: wallpaper.storyTitle || wallpaper.storyTitleEn,
      storyTitleEn: wallpaper.storyTitleEn || wallpaper.storyTitle,
      story: wallpaper.story || wallpaper.storyEn,
      storyEn: wallpaper.storyEn || wallpaper.story,
      fact: wallpaper.fact || wallpaper.factEn,
      factEn: wallpaper.factEn || wallpaper.fact,
      isCn: !!wallpaper.copyright,
      isEn: !!wallpaper.copyrightEn
    };
  }

  getWallpaperLink(id: string, isEn: boolean) {
    return `${environment.wallpaperHost}/detail/${id}${isEn ? '?lang=en' : ''}`;
  }
}
