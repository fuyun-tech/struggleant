import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { AdsStatus } from '../enums/log';
import { HttpResponseEntity } from '../interfaces/http-response';
import { AccessLog, ActionLog, LeaveLog } from '../interfaces/log';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private readonly apiService: ApiService,
    private readonly commonService: CommonService
  ) {}

  parseAccessLog(param: {
    initialized: boolean;
    referrer: string;
    isNew: boolean;
    adsStatus?: AdsStatus;
    logId: string;
  }): AccessLog {
    const { initialized, referrer, isNew, adsStatus, logId } = param;

    return {
      li: logId,
      in: isNew ? 1 : 0,
      au: location.href,
      rf: initialized ? referrer : document.referrer,
      s: 'web',
      as: adsStatus || AdsStatus.UNKNOWN,
      rs: this.commonService.getResolution(),
      cd: window.screen.colorDepth.toString(),
      ia: initialized ? 1 : 0,
      appId: APP_ID
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.ACCESS_LOG, log, false);
  }

  logAdsStatus(logId: string, status: AdsStatus): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.ACCESS_LOG_PLUGIN,
      {
        logId,
        status,
        appId: APP_ID
      },
      false
    );
  }

  logLeave(log: Omit<LeaveLog, 'appId'>): void {
    if (log.logId) {
      navigator.sendBeacon(
        this.apiService.getApiUrl(ApiUrl.ACCESS_LOG_LEAVE),
        JSON.stringify({
          ...log,
          appId: APP_ID
        })
      );
    }
  }

  logAction(log: Omit<ActionLog, 'faId' | 'ref' | 'appId'>): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.ACTION_LOG,
      {
        ...log,
        ref: location.href,
        site: 'web',
        appId: APP_ID
      },
      false
    );
  }
}
