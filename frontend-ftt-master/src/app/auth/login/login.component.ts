import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, NgForm } from '@angular/forms';
import { ServiceService } from '../../services/service.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { usuario } from '../../models/usuario';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  //usuario: usuario = new usuario();

  usua_login: "";
  usua_password: "";
  mostrar = true;


  constructor(private serviceService: ServiceService,

    //inyeccion de dependencias
    private authenticationService: AuthenticationService,
    public router: Router) { }

  ngOnInit(): void {
  }


  //     //sacar info con el jwt y guardar en el localstorage; mandar todas las peticiones
  // login(username, password) {
  //   username = this.usua_login;
  //   password = this.usua_password;

  //   this.authenticationService.loginUsuario(username, password).subscribe((a) => {
  //     localStorage.setItem("token", a.token);
  //     this.router.navigateByUrl('/menu');




  //   });

  // }

  login1(form: NgForm, username, password) {
    username = this.usua_login;
    password = this.usua_password;
    if (form.invalid) { return; }

    Swal.fire({
      allowOutsideClick: false,
      text: 'Espere un momento.....',
    });
    Swal.showLoading();


    this.authenticationService.loginUsuario(username, password)
      .subscribe(resp => {
        localStorage.setItem("token", resp.token);
        localStorage.setItem("user", username);
        this.router.navigateByUrl('/menu');
        Swal.close();
      }, (err) => {

        Swal.fire({
          allowOutsideClick: false,
          title: 'Error!',
          text: 'Usuario o password incorrecto',
          icon: 'error',
          confirmButtonText: 'ok'
        });
      })
  }

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
