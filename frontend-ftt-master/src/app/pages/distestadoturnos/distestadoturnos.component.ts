import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { DatePipe } from '@angular/common'
import { Router } from '@angular/router';

import { ServiceService } from '../../services/service.service';
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from '../../services/authentication.service';

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Utils } from '../../utils/util';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
import * as XLSX from 'xlsx';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-distestadoturnos',
  templateUrl: './distestadoturnos.component.html',
  styleUrls: ['./distestadoturnos.component.scss']
})

export class DistestadoturnosComponent implements OnInit {
  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild('fromDateDist') fromDateDist: ElementRef;
  @ViewChild('toDateDist') toDateDist: ElementRef;
  @ViewChild('fromDateDistRes') fromDateDistRes: ElementRef;
  @ViewChild('toDateDistRes') toDateDistRes: ElementRef;
  @ViewChild('codCajeroDist') codCajeroDist: ElementRef;
  @ViewChild('codCajeroDistRes') codCajeroDistRes: ElementRef;
  @ViewChild('codSucursalDist') codSucursalDist: ElementRef;
  @ViewChild('codSucursalDistRes') codSucursalDistRes: ElementRef;

  @ViewChild("horaInicioD") horaInicioD: ElementRef;
  @ViewChild("horaFinD") horaFinD: ElementRef;
  @ViewChild("horaInicioR") horaInicioR: ElementRef;
  @ViewChild("horaFinR") horaFinR: ElementRef;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioDist: any = [];
  servicioRes: any = [];
  sucursales: any[];

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesD: boolean = false;
  todasSucursalesR: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  cajerosDist: any = [];
  malRequestDist: boolean = false;
  malRequestDistPag: boolean = false;
  malRequestDistRes: boolean = false;
  malRequestDistPagRes: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configDE: any;
  configDERes: any;
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: 'Anterior',
    nextLabel: 'Siguiente'
  };

  // OBTIENE FECHA ACTUAL PARA COLOCARLO EN CUADRO DE FECHA
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year + "-" + this.month + "-" + this.day;

  // IMAGEN LOGO
  urlImagen: string;

  // OPCIONES MULTIPLES
  allSelected = false;
  selectedItems: string[] = [];
  sucursalesSeleccionadas: string[] = [];
  seleccionMultiple: boolean = false;

  // MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  // INFORMACION
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  constructor(
    private auth: AuthenticationService,
    private router: Router, public datePipe: DatePipe,
    private toastr: ToastrService,
    private serviceService: ServiceService,
    private imagenesService: ImagenesService
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configDE = {
      id: 'disestde',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioDist.length
    };
    this.configDERes = {
      id: 'disestderes',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioRes.length
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedDE(event: any) {
    this.configDE.currentPage = event;
  }
  pageChangedDERes(event: any) {
    this.configDERes.currentPage = event;
  }

  ngOnInit(): void {
    // CARGAMOS COMPONENTES SELECTS HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem('loggedUser');
    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestDistPag = true;
    this.malRequestDistPagRes = true;
    // CARGAR LOGO PARA LOS REPORTES
    this.imagenesService.cargarImagen().then((result: any) => {
      this.urlImagen = result;
    }).catch((error) => {
      Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
        (result) => (this.urlImagen = result)
      );
    });
  }

  selectAll(opcion: string) {
    switch (opcion) {
      case 'allSelected':
        this.allSelected = !this.allSelected;
        break;
      case 'todasSucursalesD':
        this.todasSucursalesD = !this.todasSucursalesD;
        this.todasSucursalesD ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      case 'todasSucursalesR':
        this.todasSucursalesR = !this.todasSucursalesR;
        this.todasSucursalesR ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadas':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      default:
        break;
    }
  }

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // SE OBTIENE LA FECHA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, 'yyyy-MM-dd');
  }

  // SE OBTIENE CAJEROS-USUARIOS EXISTENTES
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajerosDist: any) => {
      this.cajerosDist = cajerosDist.cajeros;
      this.mostrarCajeros = true;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosDist = [];
          this.mostrarCajeros = false;
        }
      });
  }

  limpiar() {
    this.cajerosDist = [];
    this.mostrarCajeros = false;
    this.selectedItems = [];
    this.allSelected = false;
    this.todasSucursalesD = false;
    this.todasSucursalesR = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  leerDistribucionTurnos() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateDist.nativeElement.value.toString().trim();
    var fH = this.toDateDist.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioD.nativeElement.value;
    let horaFin = this.horaFinD.nativeElement.value;

    if (this.selectedItems.length !== 0) {
      this.serviceService.getdistribucionturnos(fD, fH, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas).subscribe((servicio: any) => {
        // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
        this.servicioDist = servicio.turnos;
        this.malRequestDist = false;
        this.malRequestDistPag = false;
        // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
        if (this.configDE.currentPage > 1) {
          this.configDE.currentPage = 1;
        }
      },
        error => {
          if (error.status == 400) {
            //  SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioDist = null;
            this.malRequestDist = true;
            this.malRequestDistPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
            **/
            if (this.servicioDist == null) {
              this.configDE.totalItems = 0;
            } else {
              this.configDE.totalItems = this.servicioDist.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configDE = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1
            };
            // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        });
    }
  }

  leerDistribucionTurnosResumen() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateDistRes.nativeElement.value.toString().trim();
    var fH = this.toDateDistRes.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioR.nativeElement.value;
    let horaFin = this.horaFinR.nativeElement.value;

    if (this.selectedItems.length !== 0) {
      this.serviceService.getdistribucionturnosresumen(fD, fH, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas).subscribe((servicioRes: any) => {
        // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
        this.servicioRes = servicioRes.turnos;
        this.malRequestDistPagRes = false;
        this.malRequestDistRes = false;
        // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
        if (this.configDERes.currentPage > 1) {
          this.configDERes.currentPage = 1;
        }
      },
        error => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioRes = null;
            this.malRequestDistRes = true;
            this.malRequestDistPagRes = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
            **/
            if (this.servicioRes == null) {
              this.configDERes.totalItems = 0;
            } else {
              this.configDERes.totalItems = this.servicioRes.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configDERes = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1
            };
            // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        });
    }
  }

  obtenerNombreSucursal(sucursales: any) {
    const listaSucursales = sucursales;
    let nombreSucursal = "";

    listaSucursales.forEach(elemento => {
      const cod = elemento;
      if (cod == "-1") {
        nombreSucursal = "Todas las sucursales";
        return;
      }
      const nombre = this.sucursales.find(
        (sucursal) => sucursal.empr_codigo == cod
      ).empr_nombre;
      nombreSucursal += `${nombre} `;
    });
    return nombreSucursal;
  }

  // EXCEL
  exportTOExcelDist() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesD || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioDist.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioDist[step].nombreEmpresa,
          "Cajero(a)": this.servicioDist[step].Usuario,
          Servicio: this.servicioDist[step].SERV_NOMBRE,
          Fecha: new Date(this.servicioDist[step].fecha),
          "En espera": this.servicioDist[step].PENDIENTES,
          "En atención": this.servicioDist[step].EN_ATENCION,
          "En pausa": this.servicioDist[step].EN_PAUSA,
          Atendidos: this.servicioDist[step].ATENDIDOS,
          "No atendidos": this.servicioDist[step].NOATENDIDOS,
          "Total turnos": this.servicioDist[step].turnos,
        });
      }
    } else {
      for (let step = 0; step < this.servicioDist.length; step++) {
        jsonServicio.push({
          "Cajero(a)": this.servicioDist[step].Usuario,
          Servicio: this.servicioDist[step].SERV_NOMBRE,
          Fecha: new Date(this.servicioDist[step].fecha),
          "En espera": this.servicioDist[step].PENDIENTES,
          "En atención": this.servicioDist[step].EN_ATENCION,
          "En pausa": this.servicioDist[step].EN_PAUSA,
          Atendidos: this.servicioDist[step].ATENDIDOS,
          "No atendidos": this.servicioDist[step].NOATENDIDOS,
          "Total turnos": this.servicioDist[step].turnos,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioDist[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Distribucion');
    XLSX.writeFile(wb, 'dist-estadoturnos - ' + nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
  }

  exportTOExcelRes() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesR || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioRes.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioRes[step].nombreEmpresa,
          "Cajero(a)": this.servicioRes[step].Usuario,
          Servicio: this.servicioRes[step].SERV_NOMBRE,
          "En espera": this.servicioRes[step].PENDIENTES,
          "En atención": this.servicioRes[step].EN_ATENCION,
          "En pausa": this.servicioRes[step].EN_PAUSA,
          Atendidos: this.servicioRes[step].ATENDIDOS,
          "No atendidos": this.servicioRes[step].NOATENDIDOS,
          "Total turnos": this.servicioRes[step].turnos,
        });
      }
    } else {
      for (let step = 0; step < this.servicioRes.length; step++) {
        jsonServicio.push({
          "Cajero(a)": this.servicioRes[step].Usuario,
          Servicio: this.servicioRes[step].SERV_NOMBRE,
          "En espera": this.servicioRes[step].PENDIENTES,
          "En atención": this.servicioRes[step].EN_ATENCION,
          "En pausa": this.servicioRes[step].EN_PAUSA,
          Atendidos: this.servicioRes[step].ATENDIDOS,
          "No atendidos": this.servicioRes[step].NOATENDIDOS,
          "Total turnos": this.servicioRes[step].turnos,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioRes[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, 'dist-estadoturnos-res - ' + nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
  }

  generarPdfDist(action = 'open', pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fD = this.fromDateDist.nativeElement.value.toString().trim();
    var fH = this.toDateDist.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentdistribucion(fD, fH);
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case 'open': pdfMake.createPdf(documentDefinition).open(); break;
      case 'print': pdfMake.createPdf(documentDefinition).print(); break;
      case 'download': pdfMake.createPdf(documentDefinition).download(); break;
      default: pdfMake.createPdf(documentDefinition).open(); break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentdistribucion(fD: any, fH: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false, fontSize: 52 },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3 },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              'Fecha: ' + fecha + ' Hora: ' + timer,
              {
                text: [
                  {
                    text: '© Pag ' + currentPage.toString() + ' of ' + pageCount, alignment: 'right', color: 'blue', opacity: 0.5
                  }
                ],
              }
            ],
            fontSize: 9, color: '#A4B8FF',
          }
        ]
      },
      // CONTENIDO DEL PDF, LOGO, NOMBRE DEL REPORTE, CON EL RENAGO DE FECHAS DE LOS DATOS
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 45,
            },
            {
              width: '*',
              alignment: 'center',
              text: 'Reporte - Distribucion y estado de turnos',
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            }
          ]
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: 'subtitulos',
          text: 'Periodo de ' + fD + ' hasta ' + fH
        },
        this.distribucion(this.servicioDist) // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableTotal: { fontSize: 30, bold: true, alignment: 'center', fillColor: this.p_color },
        tableHeader: { fontSize: 9, bold: true, alignment: 'center', fillColor: this.p_color },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3], },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: { fontSize: 16, alignment: 'center', margin: [0, 5, 0, 10] },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: { fontSize: 12, alignment: 'center', margin: [0, 8, 0, 8], fillColor: this.p_color },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: 'blue', opacity: 0.5 }
      }
    }
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  distribucion(servicio: any[]) {
    if (this.todasSucursalesD || this.seleccionMultiple) {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Sucursal', style: 'tableHeader' },
              { text: 'Cajero(a)', style: 'tableHeader' },
              { text: 'Servicio', style: 'tableHeader' },
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'En espera', style: 'tableHeader' },
              { text: 'En atención', style: 'tableHeader' },
              { text: 'En pausa', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
              { text: 'No atendidos', style: 'tableHeader' },
              { text: 'Total turnos', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.nombreEmpresa },
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.fecha },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos },
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    } else {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Cajero(a)', style: 'tableHeader' },
              { text: 'Servicio', style: 'tableHeader' },
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'En espera', style: 'tableHeader' },
              { text: 'En atención', style: 'tableHeader' },
              { text: 'En pausa', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
              { text: 'No atendidos', style: 'tableHeader' },
              { text: 'Total turnos', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.fecha },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos },
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    }
  }

  generarPdfRes(action = 'open', pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fromDateDistRes.nativeElement.value.toString().trim();
    var fH = this.toDateDistRes.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentDistribucionRes(fD, fH);
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case 'open': pdfMake.createPdf(documentDefinition).open(); break;
      case 'print': pdfMake.createPdf(documentDefinition).print(); break;
      case 'download': pdfMake.createPdf(documentDefinition).download(); break;
      default: pdfMake.createPdf(documentDefinition).open(); break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentDistribucionRes(fD: any, fH: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false, fontSize: 52 },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3 },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              'Fecha: ' + fecha + ' Hora: ' + timer,
              {
                text: [
                  {
                    text: '© Pag ' + currentPage.toString() + ' of ' + pageCount, alignment: 'right', color: 'blue', opacity: 0.5
                  }
                ],
              }
            ],
            fontSize: 9, color: '#A4B8FF',
          }
        ]
      },
      // CONTENIDO DEL PDF, LOGO, NOMBRE DEL REPORTE, CON EL RENAGO DE FECHAS DE LOS DATOS
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 45,
            },
            {
              width: '*',
              alignment: 'center',
              text: 'Reporte - Resumen Distribucion y turnos',
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            }
          ]
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: 'subtitulos',
          text: 'Periodo de ' + fD + ' hasta ' + fH
        },
        this.distribucionRes(this.servicioRes) // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableTotal: { fontSize: 30, bold: true, alignment: 'center', fillColor: this.p_color },
        tableHeader: { fontSize: 9, bold: true, alignment: 'center', fillColor: this.p_color },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3], },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: { fontSize: 16, alignment: 'center', margin: [0, 5, 0, 10] },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: { fontSize: 12, alignment: 'center', margin: [0, 8, 0, 8], fillColor: this.p_color },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: 'blue', opacity: 0.5 }
      }
    }
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  distribucionRes(servicio: any[]) {
    if (this.todasSucursalesR || this.seleccionMultiple) {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Sucursal', style: 'tableHeader' },
              { text: 'Cajero(a)', style: 'tableHeader' },
              { text: 'Servicio', style: 'tableHeader' },
              { text: 'En espera', style: 'tableHeader' },
              { text: 'En atención', style: 'tableHeader' },
              { text: 'En pausa', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
              { text: 'No atendidos', style: 'tableHeader' },
              { text: 'Total turnos', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.nombreEmpresa },
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos }
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    } else {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Cajero(a)', style: 'tableHeader' },
              { text: 'Servicio', style: 'tableHeader' },
              { text: 'En espera', style: 'tableHeader' },
              { text: 'En atención', style: 'tableHeader' },
              { text: 'En pausa', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
              { text: 'No atendidos', style: 'tableHeader' },
              { text: 'Total turnos', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos }
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    }
  }

}
