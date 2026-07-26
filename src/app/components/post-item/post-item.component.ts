import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IconCalendarDateComponent } from 'src/app/icons/icon-calendar-date.component';
import { IconChatSquareDotsComponent } from 'src/app/icons/icon-chat-square-dots.component';
import { IconChatSquareComponent } from 'src/app/icons/icon-chat-square.component';
import { IconPencilComponent } from 'src/app/icons/icon-pencil.component';
import { PostVo } from '../../interfaces/post';
import { NumberViewPipe } from '../../pipes/number-view.pipe';
import { UserAgentService } from '../../services/user-agent.service';

@Component({
  selector: 'app-post-item',
  imports: [
    RouterLink,
    NzIconModule,
    DatePipe,
    NumberViewPipe,
    IconPencilComponent,
    IconChatSquareDotsComponent,
    IconChatSquareComponent,
    IconCalendarDateComponent
  ],
  templateUrl: './post-item.component.html',
  styleUrl: './post-item.component.less'
})
export class PostItemComponent {
  private readonly uaService = inject(UserAgentService);

  readonly post = input.required<PostVo>();
  readonly index = input.required<number>();
  readonly fromSection = input.required<boolean>();

  readonly isMobile = this.uaService.isMobile;
}
