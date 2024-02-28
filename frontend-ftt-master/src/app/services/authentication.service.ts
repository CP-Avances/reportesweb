import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { usuario } from '../models/usuario';
import { BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

  userToken: String;
  public user: usuario;
  username: '';
  password: '';
  us: '';

  private URL = environment.url;
  private backendUrl = '';

  constructor(private http: HttpClient,
    private router: Router) {
    this.leerToken();
    this.obtenerUsuario();
  }

  logout() {
    localStorage.removeItem('token');
  }

  consultarIp(sucursal: string) {
    return this.http.get<any>(`${this.URL}/service-ip/${sucursal}`)
      .pipe(
        map(resp => {
          this.backendUrl = `http://${resp['ip']}`;
          this.guardarIp(this.backendUrl);
          return resp;
        }),
        catchError(error => {
          console.error('Error al consultar IP:', error);
          return throwError(error);
        })
      );
  }

  loginUsuario(username: any, password: any) {
    return this.http.post<any>(`${this.backendUrl}/login/${username}/${password}`, {})
  }

  login(username: any, password: any) {
    return this.http.post<any>(`${this.backendUrl}/login/${username}/${password}`, {})
      .pipe(
        map(resp => {
          this.guardaToken(resp['token']);
          this.getnombreusuario(username);
          //return resp;
        })
      );
  }

  getnombreusuario(nombre) {
    sessionStorage.setItem('loggedUser', nombre);
  }

  private guardaToken(token: string) {
    this.userToken = token;
    localStorage.setItem('token', token);
  }

  private guardarIp(ip: string) {
    localStorage.setItem('ip', ip);
  }

  leerToken() {
    if (localStorage.getItem('token')) {
      this.userToken = localStorage.getItem('token')
    } else {
      this.userToken = '';
    }
    return this.userToken;
  }

  leerIp() {
    if (localStorage.getItem('ip')) {
      console.log("ip: ",localStorage.getItem('ip'));
      return localStorage.getItem('ip');
    } else {
      return '';
    }
  }

  estaAutenticado(): boolean {
    return this.userToken.length > 2;
  }

  obtenerUsuario() {
    let token = localStorage.getItem('token');
  }

}
