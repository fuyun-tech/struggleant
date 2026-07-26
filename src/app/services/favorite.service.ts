import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { FavoriteType } from '../enums/favorite';
import { HttpResponseEntity } from '../interfaces/http-response';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  constructor(private readonly apiService: ApiService) {}

  addFavorite(targetId: string, type = FavoriteType.POST): Observable<HttpResponseEntity> {
    return this.apiService
      .httpPost(
        ApiUrl.FAVORITE,
        {
          targetId,
          type
        },
        true
      )
      .pipe(map((res) => res || {}));
  }
}
