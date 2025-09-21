import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
  selector: 'app-login-modal',
  imports: [NzModalModule, LoginFormComponent],
  templateUrl: './login-modal.component.html'
})
export class LoginModalComponent {
  @Input() visible = true;
  @Input() closable = true;
  @Output() close = new EventEmitter();

  closeModal() {
    if (!this.closable) {
      return;
    }
    this.visible = false;
    this.close.emit();
  }
}
