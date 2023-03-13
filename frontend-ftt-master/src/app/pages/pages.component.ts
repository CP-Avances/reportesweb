import { Component, OnInit} from '@angular/core';

declare function customInitFunctions();

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styles: [
  ]
})
export class PagesComponent implements OnInit {
  mostrarMenu: boolean = true;

  constructor() { }

  ngOnInit(): void {
    customInitFunctions();
  }

  w3_close() {
    if (screen.width < 1024) {
      document.getElementById("menu-lateral").style.display = "block";
    } else {
      if (screen.width < 1280) {
        document.getElementById("menu-lateral").style.display = "block";
      } else {
        document.getElementById("menu-lateral").style.display = "block";
      }

    }
  }

}
