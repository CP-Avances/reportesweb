import { Injectable } from '@angular/core';
import { HttpInterceptor } from '@angular/common/http';

import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})

export class TokenInterceptorService implements HttpInterceptor {

  constructor(
    private loginServices: AuthenticationService
  ) { }


  intercept(req: any, next: any) {
    const tokenizeReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${this.loginServices.leerToken()}`
      }
    });
    return next.handle(tokenizeReq);
  }

}
