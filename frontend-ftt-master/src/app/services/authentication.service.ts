import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { usuario } from '../models/usuario';
import { BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

  userToken: String;
  public user: usuario;
  username: '';
  password: '';
  us: '';

  private URL = "http://192.168.0.11:3004";

  constructor(private http: HttpClient,
    private router: Router) {
    this.leerToken();
    this.obtenerUsuario();
  }

  logout() {
    localStorage.removeItem('token');
  }

  loginUsuario(username: any, password: any) {
    return this.http.post<any>(`${this.URL}/login/${username}/${password}`, {})
  }

  login(username: any, password: any) {
    return this.http.post<any>(`${this.URL}/login/${username}/${password}`, {})
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
    // verificar si el token es válido y no ha expirado
    return !!token;
  }

  estaAutenticado(): boolean {
    return this.userToken.length > 2;
  }

  obtenerUsuario() {
    let token = localStorage.getItem('token');
  }

}
