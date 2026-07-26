import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'env/environment';
import { catchError, Observable, of } from 'rxjs';
import { APP_ID } from '../config/common.constant';
import { Message } from '../config/message.enum';
import { HttpResponseEntity } from '../interfaces/http-response';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly message = inject(MessageService);

  getApiUrl(path: string): string {
    return `${environment.apiBase}${path}`;
  }

  httpGet<T extends HttpResponseEntity>(
    url: string,
    param: Record<string, any> = {},
    showMessage = false
  ): Observable<T> {
    return this.http
      .get<T>(this.getApiUrl(url), {
        params: new HttpParams({
          fromObject: {
            ...param,
            appId: APP_ID
          }
        }),
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(showMessage)));
  }

  httpPost<T extends HttpResponseEntity>(
    url: string,
    body: Record<string, any> | FormData = {},
    showMessage = true
  ): Observable<T> {
    if (body instanceof FormData) {
      body.append('appId', APP_ID);
    } else {
      body['appId'] = APP_ID;
    }
    return this.http
      .post<T>(this.getApiUrl(url), body, {
        observe: 'body'
      })
      .pipe(catchError(this.handleError<T>(showMessage)));
  }

  private handleError<T>(showMessage = false) {
    return (err: HttpErrorResponse): Observable<T> => {
      if (showMessage) {
        this.message.error(err.error?.message || err.message || Message.UNKNOWN_ERROR);
      }
      // Let the app keep running by returning an empty result.
      return of(err.error as T);
    };
  }
}
