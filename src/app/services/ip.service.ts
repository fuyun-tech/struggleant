import { Injectable } from '@angular/core';
import { IPInfo } from '../interfaces/ip';

@Injectable({
  providedIn: 'root'
})
export class IpService {
  getIPLocation(ipInfo?: IPInfo) {
    if (!ipInfo) {
      return '未知地区';
    }
    if (ipInfo.city) {
      return ipInfo.province + ' · ' + ipInfo.city;
    }
    if (ipInfo.province) {
      return ipInfo.country + ' · ' + ipInfo.province;
    }
    return ipInfo.country;
  }
}
