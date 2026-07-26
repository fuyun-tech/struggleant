import { Component, input, output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzQRCodeModule } from 'ng-zorro-antd/qr-code';

@Component({
  selector: 'app-share-modal',
  imports: [NzModalModule, NzQRCodeModule],
  templateUrl: './share-modal.component.html'
})
export class ShareModalComponent {
  readonly visible = input(true);
  readonly shareUrl = input('');
  readonly close = output<void>();

  closeModal() {
    this.close.emit();
  }
}
