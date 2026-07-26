import { Pipe, PipeTransform } from '@angular/core';
import { POST_LICENSE_LINK } from 'src/app/config/post.constant';
import { PostLicense } from 'src/app/enums/post';

@Pipe({
  name: 'licenseLink'
})
export class LicenseLinkPipe implements PipeTransform {
  transform(value: number): string {
    value = value || PostLicense.COMMERCIAL;

    return POST_LICENSE_LINK.get(value) || '';
  }
}
