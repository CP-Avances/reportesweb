import { AuthenticationService } from '../../services/authentication.service';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  usua_login: "";
  usua_password: "";
  sucursal: "";
  mostrar = true;

  servicios: any;

  constructor(
    // INYECCION DE DEPENDENCIAS
    private authenticationService: AuthenticationService,
    public router: Router) { }

  ngOnInit(): void {
    this.obtenerServicios();
  }

  obtenerServicios() {
    this.authenticationService.consultarNombresServicios().subscribe((a) => {
      this.servicios = a.services;
    });
  }

  login2(form: NgForm, username: any, password: any, sucursal: any) {
    if (form.invalid) { return; }

    Swal.fire({
      allowOutsideClick: false,
      text: 'Espere por favor...'
    });
    Swal.showLoading();


    this.authenticationService.consultarHost(sucursal).subscribe((a) => {
      console.log(a);
      this.authenticationService.login(username, password).subscribe((a) => {
        Swal.close();
        this.router.navigateByUrl('/menu');
      }, (err) =>
        Swal.fire({
          title: 'Error!',
          text: 'Usuario o password incorrecto',
          icon: 'error'
        })
      );
    }, (err) => {
      console.log(err);
      Swal.close();
    }
    );
  }

}
