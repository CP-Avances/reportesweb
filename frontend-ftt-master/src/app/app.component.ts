import { AutologoutService } from './services/autologout.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  title = 'reportesticketsweb';

  constructor(
    private autoLogout: AutologoutService
  ) { }



}
