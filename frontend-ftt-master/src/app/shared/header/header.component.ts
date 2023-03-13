import { Component, OnInit, HostListener, ElementRef, Renderer2, EventEmitter, Output } from '@angular/core';
import { ServiceService } from '../../services/service.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';

declare function customSidebar();


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {

  isMenuOpen = true;

  @Output() menuMostrarOcultar: EventEmitter<any> = new EventEmitter();


  constructor(
    private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router,
    private ele: ElementRef, private renderer: Renderer2
  ) { }

  ngOnInit(): void {
    customSidebar();

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
