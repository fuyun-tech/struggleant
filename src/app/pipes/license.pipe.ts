import { Pipe, PipeTransform } from '@angular/core';
import { POST_LICENSE } from 'src/app/config/post.constant';
import { PostLicense } from 'src/app/enums/post';

@Pipe({
  name: 'license'
})
export class LicensePipe implements PipeTransform {
  transform(value: number): string {
    value = value || PostLicense.COMMERCIAL;

    return POST_LICENSE.get(value)?.title || '';
  }
}
