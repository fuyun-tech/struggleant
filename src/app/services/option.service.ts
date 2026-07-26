import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Carousel } from 'src/app/interfaces/carousel';
import { OptionEntity } from 'src/app/interfaces/option';
import { ApiUrl } from '../config/api-url';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  private options: BehaviorSubject<OptionEntity> = new BehaviorSubject<OptionEntity>({});
  public options$: Observable<OptionEntity> = this.options.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getOptions(): Observable<OptionEntity> {
    return this.apiService.httpGet(ApiUrl.OPTION_FRONTEND, {}).pipe(
      map((res) => res?.data || {}),
      tap((options) => {
        this.options.next(options);
      })
    );
  }

  getCarousels(): Observable<Carousel[]> {
    return this.apiService.httpGet(ApiUrl.OPTION_CAROUSELS, {}).pipe(map((res) => res?.data || []));
  }
}
