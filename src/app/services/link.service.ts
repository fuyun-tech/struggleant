import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { FavoriteLink, LinkVo } from '../interfaces/link';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  constructor(private readonly apiService: ApiService) {}

  getFriendLinks(isHome: boolean): Observable<LinkVo[]> {
    return this.apiService
      .httpGet(ApiUrl.LINK_FRIEND, {
        isHome
      })
      .pipe(map((res) => res?.data || []));
  }

  getFavoriteLinks(): Observable<FavoriteLink[]> {
    return this.apiService.httpGet(ApiUrl.LINK_FAVORITE, {}).pipe(map((res) => res?.data || []));
  }

  getFooterLinks(): Observable<LinkVo[]> {
    return this.apiService.httpGet(ApiUrl.LINK_FOOTER, {}).pipe(map((res) => res?.data || []));
  }
}
