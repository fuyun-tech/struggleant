import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { CategoryType } from '../enums/category';
import { CategoryNode } from '../interfaces/category';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private readonly apiService: ApiService) {}

  getCategories(): Observable<CategoryNode[]> {
    return this.apiService
      .httpGet(ApiUrl.CATEGORY_TREE, {
        type: CategoryType.POST
      })
      .pipe(map((res) => res?.data || []));
  }
}
