import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiderComponent } from 'src/app/components/sider/sider.component';
import { UserAgentService } from 'src/app/services/user-agent.service';

@Component({
  selector: 'app-content-layout',
  imports: [RouterOutlet, SiderComponent],
  templateUrl: './content-layout.component.html',
  styleUrl: './content-layout.component.less'
})
export class ContentLayoutComponent {
  private readonly uaService = inject(UserAgentService);

  readonly isMobile = this.uaService.isMobile;
}
