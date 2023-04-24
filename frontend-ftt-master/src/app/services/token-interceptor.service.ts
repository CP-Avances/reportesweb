import { Injectable } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { HttpInterceptor } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService implements HttpInterceptor {

  constructor(
    private loginServices: AuthenticationService
  ) { }


  intercept(req, next) {

    const tokenizeReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${this.loginServices.leerToken()}`
      }
    });
    return next.handle(tokenizeReq);
  }

}
