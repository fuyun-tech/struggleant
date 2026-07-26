import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { HttpResponseEntity } from '../interfaces/http-response';
import { VoteDto } from '../interfaces/vote';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private readonly apiService: ApiService) {}

  saveVote(payload: VoteDto): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.VOTE, payload, true).pipe(map((res) => res || {}));
  }
}
