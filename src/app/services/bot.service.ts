import { Injectable } from '@angular/core';
import { Bot } from 'src/app/interfaces/bot';
import { TenantAppModel } from 'src/app/interfaces/tenant-app';

@Injectable({
  providedIn: 'root'
})
export class BotService {
  getBotAvatar(appInfo: TenantAppModel, bot?: Bot): string {
    return bot?.botAvatar || appInfo.appFaviconUrl;
  }
}
