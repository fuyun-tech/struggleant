import { Injectable } from '@angular/core';
import { Bot } from 'src/app/interfaces/bot';
import { TenantAppVo } from 'src/app/interfaces/tenant-app';

@Injectable({
  providedIn: 'root'
})
export class BotService {
  getBotAvatar(appInfo: TenantAppVo, bot?: Bot): string {
    return bot?.avatarUrl || appInfo.faviconUrl;
  }
}
