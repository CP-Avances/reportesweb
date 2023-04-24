import { Component, OnInit, HostListener, ElementRef, Renderer2, EventEmitter, Output } from '@angular/core';
import { ServiceService } from '../../services/service.service';
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from '../../services/authentication.service';
import { ToastrService } from "ngx-toastr";
import { Router } from '@angular/router';
import { Utils } from "../../utils/util";

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
    private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router,
    private ele: ElementRef, 
    private renderer: Renderer2,
    private toastr: ToastrService,
    private imagenesService: ImagenesService,
  ) { }

  ngOnInit(): void {
    customSidebar();
    this.imagenesService.cargarImagen().then((result: string) => {
      this.urlImagen = result;
      this.mostrarLogo = true;
    }).catch((error) => {
      // SE INFORMA QUE NO SE PUDO CARGAR LA IMAGEN
      this.toastr.info("Error al cargar el logo, se utilizará la imagen por defecto", "Upss !!!.", {
        timeOut: 6000,
      });
      Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
        (result) => (this.urlImagen = result,this.mostrarLogo = true)
      );
    });
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
    location.reload();
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
