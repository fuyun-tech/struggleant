import { Component } from '@angular/core';
import { ContentType } from 'src/app/enums/post';
import { PostComponent } from 'src/app/pages/post/post.component';

@Component({
  selector: 'app-page',
  imports: [PostComponent],
  template: `<app-post [contentType]="contentType"></app-post>`
})
export class PageComponent {
  contentType = ContentType.PAGE;
}
