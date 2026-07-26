import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserAiStatus } from 'src/app/enums/user';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';
import { format } from 'src/app/utils/helper';
import { ApiUrl } from '../config/api-url';
import { URL_AVATAR_API } from '../config/common.constant';
import { UserModel } from '../interfaces/user';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private user: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>({
    id: '',
    nickname: '',
    permissions: [],
    aiStatus: UserAiStatus.DISABLED,
    aiModels: [],
    aiExpiresAt: 0,
    aiLimit: 0,
    appId: ''
  });
  user$: Observable<UserModel> = this.user.asObservable();

  constructor(private readonly apiService: ApiService) {}

  getProfile(): Observable<UserModel> {
    return this.apiService.httpGet(ApiUrl.USER_PROFILE, {}).pipe(
      map((res) => res?.data || {}),
      tap((user) => this.user.next(user))
    );
  }

  getSignupUser(userId: string): Observable<UserModel> {
    return this.apiService
      .httpGet(ApiUrl.USER_SIGNUP_INFO, {
        userId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getUserAvatar(user: UserModel, avatarType: string, appInfo: TenantAppVo): string {
    let avatar: string;
    if (user.avatarUrl) {
      avatar = user.avatarUrl;
    } else {
      avatar = user.emailHash ? format(URL_AVATAR_API, user.emailHash, avatarType || 'monsterid') : appInfo.faviconUrl;
    }
    return avatar;
  }
}
