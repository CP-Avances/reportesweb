import { Component, OnInit } from '@angular/core';
import { usuario } from '../../models/usuario';
import { Router } from '@angular/router';

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
    public router: Router,
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

  toggleMenu($event: any) {
    $event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

}
