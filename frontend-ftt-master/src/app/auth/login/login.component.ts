import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  usua_login: "";
  usua_password: "";
  mostrar = true;

  constructor(
    // INYECCION DE DEPENDENCIAS
    private authenticationService: AuthenticationService,
    public router: Router) { }

  ngOnInit(): void {
  }

  // login1(form: NgForm, username: any, password: any) {
  //   username = this.usua_login;
  //   password = this.usua_password;
  //   if (form.invalid) { return; }

  //   Swal.fire({
  //     allowOutsideClick: false,
  //     text: 'Espere un momento.....',
  //   });
  //   Swal.showLoading();


  //   this.authenticationService.loginUsuario(username, password)
  //     .subscribe(resp => {
  //       localStorage.setItem("token", resp.token);
  //       localStorage.setItem("user", username);
  //       this.router.navigateByUrl('/menu');
  //       Swal.close();
  //     }, (err) => {
  //       Swal.fire({
  //         allowOutsideClick: false,
  //         title: 'Error!',
  //         text: 'Usuario o password incorrecto.',
  //         icon: 'error',
  //         confirmButtonText: 'ok'
  //       });
  //     })
  // }

  login2(form: NgForm, username, password) {
    if (form.invalid) { return; }

    Swal.fire({
      allowOutsideClick: false,
      text: 'Espere por favor...'
    });
    Swal.showLoading();
    

    this.authenticationService.login(username, password)
      .subscribe(resp => {
        Swal.close();
        this.router.navigateByUrl('/menu');
      }, (err) => {
        Swal.fire({
          title: 'Error!',
          text: 'Usuario o password incorrecto',
          icon: 'error'
        })
      })

  }

}
