import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

import { usuario } from '../models/usuario';
import { environment } from 'src/environments/enviroment.developments';
import { throwError } from 'rxjs';

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

  constructor(
    private http: HttpClient
  ) {
    // this.leerToken();
    // this.obtenerUsuario();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('host');
  }

  consultarHost(sucursal: string) {
    return this.http.get<any>(`${this.URL}/service-host/${sucursal}`)
      .pipe(
        map(resp => {
          this.backendUrl = `http://${resp['host']}`;
          this.guardarHost(this.backendUrl);
          return resp;
        }),
        catchError(error => {
          console.error('Error al consultar Host:', error);
          return throwError(error);
        })
      );
  }

  consultarNombresServicios() {
    return this.http.get<any>(`${this.URL}/service-names`)
      .pipe(
        map(resp => {
          return resp;
        }),
        catchError(error => {
          console.error('Error al consultar Nombres de Servicios:', error);
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

  private guardarHost(host: string) {
    localStorage.setItem('host', host);
  }

  leerToken() {
    if (localStorage.getItem('token')) {
      this.userToken = localStorage.getItem('token')
    } else {
      this.userToken = '';
    }
    return this.userToken;
  }

  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  estaAutenticado(): boolean {
    return this.userToken.length > 2;
  }

  obtenerUsuario() {
    let token = localStorage.getItem('token');
  }

}
