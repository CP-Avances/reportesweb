import { Component, OnInit, ViewChild } from '@angular/core';
import { ServiceService } from '../../services/service.service';
import { AuthenticationService } from '../../services/authentication.service';

import { DatePickerDirective } from 'ng2-date-picker';
import { Router } from '@angular/router';
import { Utils } from '../../utils/util';

///pdf
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import moment from 'moment';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  chart: any;
  tipo: string;
  servicio1: any;
  servicio: any;
  servicio2: any;
  serviciosearch: any;
  serviciosearch1: any;
  serviciosearch2: any;
  serviciosearch3: any;
  ////////////
  servgraf1: any;
  servgraf2: any;
  servgraf3: any;
  servgraf4: any;
  grafeva: any;
  grafeva2: any;

  p_color: any;

  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();

 // date = this.year + "-" + this.month + "-" + this.day;
 date: any;

  // items de paginacion de la tabla
  tamanio_pagina: number = 5;
  numero_pagina: number = 1;
  pageSizeOptions = [5, 10, 20, 50];

  urlImagen: string;

  public canvas: any;
  public ctx;
  public chartColor;
  public chartEmail;
  public chartHours;

  progreso: number = 27.88;
  excelente: number = 0;

  servicio5: any;
  servicio6: any;

  altoMA: any;
  altoPr: any;


  @ViewChild('dateDirectivePicker')
  datePickerDirective: DatePickerDirective;

  constructor(private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router) { }

  ngOnInit(): void {
    var f = moment();
    this.date = f.format('YYYY-MM-DD');
    this.tipo = 'pie';
    ///////
    this.gettotaltickets();
    this.gettotalatendidos();
    this.getsinatender();
    this.getpromedioatencion();
    this.getgrafeva();
    /////
    this.getevaluacionsucursal();
    this.getserviciosmasatendidos();

    Utils.getImageDataUrlFromLocalPath1('assets/logotickets.png').then(
      result => this.urlImagen = result
    );
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  ///////////////////////////////////////////////////
  gettotaltickets() {
    this.serviceService.gettotaltickets(this.date).subscribe((servgraf1: any) => {
      this.servgraf1 = servgraf1.turnos;
    });
  }

  gettotalatendidos() {
    this.serviceService.gettotalatendidos(this.date).subscribe((servgraf2: any) => {
      this.servgraf2 = servgraf2.turnos;
    });
  }


  getsinatender() {
    this.serviceService.gettotalsinatender(this.date).subscribe((servgraf3: any) => {
      this.servgraf3 = servgraf3.turnos;
    });
  }


  getpromedioatencion() {
    this.serviceService.getpromedioatencion(this.date).subscribe((servgraf4: any) => {
      this.servgraf4 = servgraf4.turnos;
    });
  }

  getgrafeva() {
    this.serviceService.getgrafeva().subscribe((grafeva: any) => {
      this.grafeva = grafeva.turnos;
    });
  }

  /////////////////////////////////////
  get getProcentaje() {
    return `${this.progreso}%`;
  }

  getevaluacionsucursal() {
    this.serviceService.getgraficobarras().subscribe((servicio5: any) => {
      this.servicio5 = servicio5.turnos;
      this.altoPr = Math.max.apply(null, servicio5.turnos.map(res => res.total));
      let evaluaciones = servicio5.turnos.map(res => res.evaluacion);
    });
  }

  getserviciosmasatendidos() {
    this.serviceService.getserviciossolicitados().subscribe((servicio6: any) => {
      this.servicio6 = servicio6.turnos;
      this.altoMA = Math.max.apply(null, servicio6.turnos.map(res => res.Total));
    });
  }

  /////////////////PDFMAKE
  openPdf() {
    const documentDefinition = { content: 'This is an sample PDF printed with pdfMake' };
    pdfMake.createPdf(documentDefinition).open();
  }

}
