import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { Router } from '@angular/router';
import { Utils } from "../../utils/util";

import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from '../../services/authentication.service';

declare function customSidebar();

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})

export class HeaderComponent implements OnInit {

  isMenuOpen = true;
  mostrarLogo = false;
  urlImagen: string;
  nombreImagen: any[];

  @Output() menuMostrarOcultar: EventEmitter<any> = new EventEmitter();

  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private toastr: ToastrService,
    private imagenesService: ImagenesService,
  ) { }

  ngOnInit(): void {
    customSidebar();
    this.imagenesService.cargarImagen().then((result: any) => {
      this.urlImagen = result;
      this.mostrarLogo = true;
    }).catch((error) => {
      // SE INFORMA QUE NO SE PUDO CARGAR LA IMAGEN
      this.toastr.info("Error al cargar el logo, se utilizará la imagen por defecto", "Upss !!!.", {
        timeOut: 6000,
      });
      Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
        (result) => (this.urlImagen = result, this.mostrarLogo = true)
      );
    });
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  mostrarMenu() {
    this.menuMostrarOcultar.emit(true);
  }

  ocultarMenu() {
    this.menuMostrarOcultar.emit(false);
  }

  w3_open() {
    document.getElementById("menu-lateral").style.display = "block";
  }

  w3_close() {
    document.getElementById("mySidebar").style.display = "none";
  }

}
