import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiUrl } from '../config/api-url';
import { ResultList } from '../interfaces/common';
import { SearchParam, SearchResponse } from '../interfaces/search';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private readonly apiService: ApiService) {}

  search(param: SearchParam): Observable<ResultList<SearchResponse>> {
    return this.apiService.httpGet(ApiUrl.SEARCH_POSTS, param).pipe(map((res) => res?.data || {}));
  }
}
