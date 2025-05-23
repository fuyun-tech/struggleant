import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUrl } from '../config/api-url';
import { APP_ID } from '../config/common.constant';
import { AdsStatus } from '../enums/log';
import { HttpResponseEntity } from '../interfaces/http-response';
import { AccessLog, ActionLog, LeaveLog } from '../interfaces/log';
import { ApiService } from './api.service';
import { UserAgentService } from './user-agent.service';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(
    private readonly apiService: ApiService,
    private readonly userAgentService: UserAgentService
  ) {}

  parseAccessLog(param: {
    initialized: boolean;
    referrer: string;
    isNew: boolean;
    adsStatus?: AdsStatus;
    logId: string;
  }): AccessLog {
    const { initialized, referrer, isNew, adsStatus, logId } = param;
    const uaInfo = this.userAgentService.uaInfo;

    return {
      li: logId,
      in: isNew ? 1 : 0,
      au: location.href,
      rf: initialized ? referrer : document.referrer,
      s: 'web',
      as: adsStatus || AdsStatus.UNKNOWN,
      rs: window.screen.width + 'x' + window.screen.height,
      cd: window.screen.colorDepth.toString(),
      ia: initialized ? 1 : 0,
      os: uaInfo.os,
      ov: uaInfo.osVersion,
      a: uaInfo.architecture,
      b: uaInfo.browser,
      bv: uaInfo.browserVersion,
      e: uaInfo.engine,
      ev: uaInfo.engineVersion,
      im: uaInfo.isMobile ? 1 : 0,
      ic: uaInfo.isCrawler ? 1 : 0,
      ua: uaInfo.userAgent,
      appId: APP_ID
    };
  }

  logAccess(log: AccessLog): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(ApiUrl.LOG_ACCESS, log, false);
  }

  logAdsStatus(logId: string, status: AdsStatus): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.LOG_ADS,
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
        this.apiService.getApiUrl(ApiUrl.LOG_LEAVE),
        JSON.stringify({
          ...log,
          appId: APP_ID
        })
      );
    }
  }

  logAction(log: Omit<ActionLog, 'faId' | 'ref' | 'appId'>): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.LOG_ACTION,
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
