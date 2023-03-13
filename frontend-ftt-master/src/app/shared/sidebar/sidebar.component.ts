import { Component, HostListener, OnInit, ElementRef, EventEmitter, Output } from '@angular/core';
import { usuario } from '../../models/usuario';
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { ServiceService } from '../../services/service.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {

  public usuario: usuario;
  public text: String;

  isMenuOpen = true;

  userDisplayName = '';


  constructor(
    private serviceService: ServiceService,
    //inyeccion de dependencias
    private authenticationService: AuthenticationService,
    public router: Router,
    private eRef: ElementRef
  ) {
    this.text = 'no clicks yet';
  }

  ngOnInit(): void {
    this.datatoken();
    this.userDisplayName = sessionStorage.getItem('loggedUser');
  }

  datatoken() {
    let token = localStorage.getItem("token");
  }

  toggleMenu($event) {
    $event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

}
