import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { Chart } from "chart.js";
import { Utils } from "../../utils/util";

import { AuthenticationService } from "../../services/authentication.service";
import { ServiceService } from "../../services/service.service";
import { ImagenesService } from "../../shared/imagenes.service";

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { servicio } from '../../models/servicio';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
const EXCEL_EXTENSION = ".xlsx";

@Component({
  selector: "app-atencion",
  templateUrl: "./atencion.component.html",
  styleUrls: ["./atencion.component.scss"],
})

export class AtencionComponent implements OnInit {

  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("fromDateAtTC") fromDateAtTC: ElementRef;
  @ViewChild("toDateAtTC") toDateAtTC: ElementRef;
  @ViewChild("fromDateAtC") fromDateAtC: ElementRef;
  @ViewChild("toDateAtC") toDateAtC: ElementRef;
  @ViewChild("fromDateAtPA") fromDateAtPA: ElementRef;
  @ViewChild("toDateAtPA") toDateAtPA: ElementRef;
  @ViewChild("fromDateAtTA") fromDateAtTA: ElementRef;
  @ViewChild("toDateAtTA") toDateAtTA: ElementRef;
  @ViewChild("fromDateAtMA") fromDateAtMA: ElementRef;
  @ViewChild("toDateAtMA") toDateAtMA: ElementRef;
  @ViewChild("fromDateAtAS") fromDateAtAS: ElementRef;
  @ViewChild("toDateAtAS") toDateAtAS: ElementRef;
  @ViewChild("fromDateAtG") fromDateAtG: ElementRef;
  @ViewChild("toDateAtG") toDateAtG: ElementRef;

  @ViewChild("horaInicioTC") horaInicioTC: ElementRef;
  @ViewChild("horaFinTC") horaFinTC: ElementRef;
  @ViewChild("horaInicioC") horaInicioC: ElementRef;
  @ViewChild("horaFinC") horaFinC: ElementRef;
  @ViewChild("horaInicioPA") horaInicioPA: ElementRef;
  @ViewChild("horaFinPA") horaFinPA: ElementRef;
  @ViewChild("horaInicioTA") horaInicioTA: ElementRef;
  @ViewChild("horaFinTA") horaFinTA: ElementRef;
  @ViewChild("horaInicioTM") horaInicioTM: ElementRef;
  @ViewChild("horaFinTM") horaFinTM: ElementRef;
  @ViewChild("horaInicioAS") horaInicioAS: ElementRef;
  @ViewChild("horaFinAS") horaFinAS: ElementRef;
  @ViewChild("horaInicioGS") horaInicioGS: ElementRef;
  @ViewChild("horaFinGS") horaFinGS: ElementRef;


  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioTiempoComp: any = [];
  serviciopa: any = [];
  serviciota: any = [];
  serviciomax: any = [];
  servicioatser: any = [];
  serviciograf: any = [];
  serviciosAtPA: any = [];
  clientes: any = [];
  cajerosAtencion: any = [];
  sucursales: any[];
  opciones: any[];

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesTC: boolean = false;
  todasSucursalesC: boolean = false;
  todasSucursalesPA: boolean = false;
  todasSucursalesTA: boolean = false;
  todasSucursalesMA: boolean = false;
  todasSucursalesAS: boolean = false;
  todasSucursalesGS: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestAtTC: boolean = false;
  malRequestAtTCPag: boolean = false;
  malRequestAtC: boolean = false;
  malRequestAtCPag: boolean = false;
  malRequestAtPA: boolean = false;
  malRequestAtPAPag: boolean = false;
  malRequestAtTA: boolean = false;
  malRequestAtTAPag: boolean = false;
  malRequestAtMA: boolean = false;
  malRequestAtMAPag: boolean = false;
  malRequestAtAS: boolean = false;
  malRequestAtASPag: boolean = false;
  malRequestAtG: boolean = false;
  malRequestAtGPag: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // GRAFICO
  tipo: string;
  chart: any;
  legend: any;

  // MAXIMO DE ITEMS MOSTRADO DE TABLA EN PANTALLA
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };

  // CONTROL PAGINACION
  configTC: any;
  configC: any;
  configPA: any;
  configTA: any;
  configMA: any;
  configAS: any;
  configGS: any;

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

  //MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  //MOSTRAR SERVICIOS
  mostrarServicios: boolean = false;

  // ORIENTACION
  orientacion: string;

  // INFORMACION
  marca: string = "Fulltime Tickets";
  horas: number[] = [];

  identificacionCliente: string = 'nombre';

  constructor(
    private imagenesService: ImagenesService,
    private serviceService: ServiceService,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
  ) {

    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configTC = {
      id: "Atenciontc",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTiempoComp.length,
    };
    this.configC = {
      id: "Atencionc",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.clientes.length,
    };
    this.configPA = {
      id: "Atencionpa",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.serviciopa.length,
    };
    this.configTA = {
      id: "Atencionta",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.serviciota.length,
    };
    this.configMA = {
      id: "Atencionma",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.serviciomax.length,
    };
    this.configAS = {
      id: "Atencionas",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioatser.length,
    };
    this.configGS = {
      id: "Atenciongs",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.serviciograf.length,
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }

  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedTC(event: any) {
    this.configTC.currentPage = event;
  }
  pageChangedC(event: any) {
    this.configC.currentPage = event;
  }
  pageChangedPA(event1: any) {
    this.configPA.currentPage = event1;
  }
  pageChangedTA(event1: any) {
    this.configTA.currentPage = event1;
  }
  pageChangedMA(event: any) {
    this.configMA.currentPage = event;
  }
  pageChangedAS(event: any) {
    this.configAS.currentPage = event;
  }
  pageChangedGS(event: any) {
    this.configGS.currentPage = event;
  }

  ngOnInit(): void {
    // CARGAMOS COMPONENTES SELECTS HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();

    this.getIdentificacionCliente();

    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");

    // SETEO DE TIPO DE GRAFICO
    this.tipo = "bar";

    // SETEO ORIENTACION
    this.orientacion = "portrait";

    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestAtTCPag = true;
    this.malRequestAtCPag = true;
    this.malRequestAtPAPag = true;
    this.malRequestAtTAPag = true;
    this.malRequestAtMAPag = true;
    this.malRequestAtASPag = true;
    this.malRequestAtGPag = true;

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
        case 'todasSucursalesGS':
            this.todasSucursalesGS = !this.todasSucursalesGS;
            break;
        case 'todasSucursalesTC':
          this.todasSucursalesTC = !this.todasSucursalesTC;
          this.todasSucursalesTC ? this.getCajeros(this.sucursalesSeleccionadas) : null;
          break;
        case 'todasSucursalesC':
          this.todasSucursalesC = !this.todasSucursalesC;
          this.todasSucursalesC ? this.getCajeros(this.sucursalesSeleccionadas) : null;
          break;
        case 'todasSucursalesAS':
          this.todasSucursalesAS = !this.todasSucursalesAS;
          this.todasSucursalesAS ? this.getCajeros(this.sucursalesSeleccionadas) : null;
          break;
        case 'todasSucursalesPA':
          this.todasSucursalesPA = !this.todasSucursalesPA;
          this.todasSucursalesPA ? this.getServicios(this.sucursalesSeleccionadas) : null;
          break;
        case 'todasSucursalesTA':
          this.todasSucursalesTA = !this.todasSucursalesTA;
          this.todasSucursalesTA ? this.getServicios(this.sucursalesSeleccionadas) : null;
          break;
        case 'todasSucursalesMA':
          this.todasSucursalesMA = !this.todasSucursalesMA;
          this.todasSucursalesMA ? this.getServicios(this.sucursalesSeleccionadas) : null;
          break;
        case 'sucursalesSeleccionadas':
          this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
          this.sucursalesSeleccionadas.length > 0 ? this.getCajeros(this.sucursalesSeleccionadas) : null;
          break;
        case 'sucursalesSeleccionadasS':
          this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
          this.sucursalesSeleccionadas.length > 0 ? this.getServicios(this.sucursalesSeleccionadas) : null;
          break;
        default:
            break;
    }
  }

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // OBTIENE LA FECHA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  // FUNCION PARA LLENAR SELECT CON USUARIOS/CAJEROS EXISTENTES
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajeros: any) => {
      this.cajerosAtencion = cajeros.cajeros;
      this.mostrarCajeros = true;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosAtencion = [];
          this.mostrarCajeros = false;
        }
      });
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  // OBTINENE EL PARAMETRO DE IDENTIFICACION DEL CLIENTE
  getIdentificacionCliente() {
    this.serviceService.getIdentificacionCliente().subscribe((identificacion: any) => {
      this.identificacionCliente = identificacion.valor[0].gene_valor;
    });
  }

  limpiar() {
    this.serviciosAtPA=[]
    this.selectedItems = [];
    this.cajerosAtencion=[];
    this.mostrarCajeros = false;
    this.mostrarServicios = false;
    this.allSelected = false;
    this.todasSucursalesTC = false;
    this.todasSucursalesC = false;
    this.todasSucursalesPA = false;
    this.todasSucursalesTA = false;
    this.todasSucursalesMA = false;
    this.todasSucursalesAS = false;
    this.todasSucursalesGS = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  // CAMBIO DE TIPO DE GRAFICO
  cambiar(tipo: string) {
    this.tipo = tipo;
    if (this.chart) {
      this.chart.destroy();
    }
    this.leerGrafico();
  }

  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  // CONSULTA PARA LLENAR SELECT DE INTERFAZ
  getServicios(sucursal: any) {
    this.serviceService.getAllServiciosS(sucursal).subscribe((serviciosAtPA: any) => {
      this.serviciosAtPA = serviciosAtPA.servicios;
      this.mostrarServicios = true;
    },
      (error) => {
        if (error.status == 400) {
          this.serviciosAtPA = [];
          this.mostrarServicios = false;
        }
      });
  }

  leerTiempcompleto() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtTC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTC.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioTC.nativeElement.value;
    let horaFin = this.horaFinTC.nativeElement.value;

    if (this.selectedItems.length!==0) {
      this.serviceService
        .gettiemposcompletos(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioTiempoComp = servicio.turnos;
            this.malRequestAtTC = false;
            this.malRequestAtTCPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTC.currentPage > 1) {
              this.configTC.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioTiempoComp = null;
              this.malRequestAtTC = true;
              this.malRequestAtTCPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.servicioTiempoComp == null) {
                this.configTC.totalItems = 0;
              } else {
                this.configTC.totalItems = this.servicioTiempoComp.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configTC = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  leerCliente() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtC.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioC.nativeElement.value;
    let horaFin = this.horaFinC.nativeElement.value;

    if (this.selectedItems.length!==0) {
      this.serviceService
        .getclientes(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.clientes = servicio.turnos;
            this.malRequestAtC = false;
            this.malRequestAtCPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configC.currentPage > 1) {
              this.configC.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.clientes = null;
              this.malRequestAtC = true;
              this.malRequestAtCPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.clientes == null) {
                this.configC.totalItems = 0;
              } else {
                this.configC.totalItems = this.clientes.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configC = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  leerPromAtencion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtPA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtPA.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioPA.nativeElement.value;
    let horaFin = this.horaFinPA.nativeElement.value;

    if (this.selectedItems.length!==0) {  
      this.serviceService
        .getpromatencion(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (serviciopa: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.serviciopa = serviciopa.turnos;
            this.malRequestAtPA = false;
            this.malRequestAtPAPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configPA.currentPage > 1) {
              this.configPA.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.serviciopa = null;
              this.malRequestAtPA = true;
              this.malRequestAtPAPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.serviciopa == null) {
                this.configPA.totalItems = 0;
              } else {
                this.configPA.totalItems = this.serviciopa.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configPA = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  leerTiempoAtencion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtTA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTA.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioTA.nativeElement.value;
    let horaFin = this.horaFinTA.nativeElement.value;

    if (this.selectedItems.length!==0) {  
      this.serviceService
        .gettiempoatencion(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (serviciota: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.serviciota = serviciota.turnos;
            this.malRequestAtTA = false;
            this.malRequestAtTAPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTA.currentPage > 1) {
              this.configTA.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.serviciota = null;
              this.malRequestAtTA = true;
              this.malRequestAtTAPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.serviciota == null) {
                this.configTA.totalItems = 0;
              } else {
                this.configTA.totalItems = this.serviciota.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configTA = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  leerMaxAtencion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtMA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtMA.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioTM.nativeElement.value;
    let horaFin = this.horaFinTM.nativeElement.value;

    if (this.selectedItems.length!==0) {
      this.serviceService
        .getmaxatencion(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (serviciomax: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.serviciomax = serviciomax.turnos;
            this.malRequestAtMA = false;
            this.malRequestAtMAPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configMA.currentPage > 1) {
              this.configMA.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.serviciomax = null;
              this.malRequestAtMA = true;
              this.malRequestAtMAPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.serviciomax == null) {
                this.configMA.totalItems = 0;
              } else {
                this.configMA.totalItems = this.serviciomax.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configMA = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  leerAtencionServicio() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtAS.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtAS.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioAS.nativeElement.value;
    let horaFin = this.horaFinAS.nativeElement.value;

    if (this.selectedItems.length!==0) {
      this.serviceService
        .getatencionservicio(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (servicioatser: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioatser = servicioatser.turnos;
            this.malRequestAtAS = false;
            this.malRequestAtASPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configAS.currentPage > 1) {
              this.configAS.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioatser = null;
              this.malRequestAtAS = true;
              this.malRequestAtASPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.servicioatser == null) {
                this.configAS.totalItems = 0;
              } else {
                this.configAS.totalItems = this.servicioatser.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configAS = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  leerGrafico() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtG.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtG.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioGS.nativeElement.value;
    let horaFin = this.horaFinGS.nativeElement.value;

    this.malRequestAtG = false;

    if (this.sucursalesSeleccionadas.length!==0) {
      this.serviceService.getatenciongrafico(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (serviciograf: any) => {
          // VERIFICACION DE ANCHO DE PANTALLA PARA MOSTRAR O NO LABELS
          this.legend = screen.width < 575 ? false : true;
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.serviciograf = serviciograf.turnos;
          // this.malRequestAtG = false;
          this.malRequestAtGPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configGS.currentPage > 1) {
            this.configGS.currentPage = 1;
          }
          // MAPEO DE DATOS PARA IMPRIMIR EN GRAFICO
          let Nombres = serviciograf.turnos.map((res) => res.Servicio);
          let totales = serviciograf.turnos.map((res) => res.Total);
          let atendidos = serviciograf.turnos.map((res) => res.Atendidos);
          let noAtendidos = serviciograf.turnos.map((res) => res.No_Atendidos);
  
          // SETEO DE CADA GRUPO DE DATOS
          var atendidosData = {
            label: "Atendidos",
            data: atendidos,
            backgroundColor: "rgba(0, 99, 132, 0.6)",
          };
          var noAtendidosData = {
            label: "No atendidos",
            data: noAtendidos,
            backgroundColor: "rgba(99, 132, 0, 0.6)",
          };
          var totalesData = {
            type: "scatter",
            label: "Totales",
            data: totales,
            backgroundColor: "rgba(220, 46, 86, 0.6)",
          };
          var graficoData = {
            labels: Nombres,
            datasets: [atendidosData, noAtendidosData, totalesData],
          };
  
          // CREACION DEL GRAFICO
          this.chart = new Chart("canvas", {
            type: "bar",
            data: graficoData,
            options: {
              plugins: {
                datalabels: {
                  color: "black",
                  labels: {
                    title: {
                      font: {
                        weight: "bold",
                      },
                    },
                  },
                },
              },
              scales: {
                /* xAxis: [
                   {
                     ticks: {
                       display: this.legend,
                     },
                   },
                 ],*/
              },
              responsive: true,
            },
          });
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.serviciograf = null;
            this.malRequestAtG = true;
            this.malRequestAtGPag = true;
            // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
            // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
            if (this.serviciograf == null) {
              this.configGS.totalItems = 0;
            } else {
              this.configGS.totalItems = this.serviciograf.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configGS = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1,
            };
            // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        }
      );
    }
    // SI CHART ES VACIO NO PASE NADA, CASO CONTRARIO SI TIENEN YA DATOS, SE DESTRUYA PARA CREAR UNO NUEVO, 
    // EVITANDO SUPERPOSISION DEL NUEVO CHART
    if (this.chart != undefined || this.chart != null) {
      this.chart.destroy();
    }
  }

  obtenerNombreSucursal(sucursales: any) {
    const listaSucursales = sucursales;
    let nombreSucursal = "";
    
    listaSucursales.forEach(elemento => {
      const cod = elemento;
      if (cod=="-1") {
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

  /** ***************************************************************************************************** **
   ** **                                               EXCEL                                             ** ** 
   ** ***************************************************************************************************** **/
 
   exportarAExcelTiempoComp() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesTC || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioTiempoComp.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioTiempoComp[step].nombreEmpresa,
          "Cajero(a)": this.servicioTiempoComp[step].Usuario,
          Servicio: this.servicioTiempoComp[step].Servicio,
          Fecha: new Date(this.servicioTiempoComp[step].Fecha),
          "Tiempo Espera": this.servicioTiempoComp[step].Tiempo_Espera,
          "Tiempo Atención": this.servicioTiempoComp[step].Tiempo_Atencion,
        });
      }
    }
    else {
      for (let step = 0; step < this.servicioTiempoComp.length; step++) {
        jsonServicio.push({
          "Cajero(a)": this.servicioTiempoComp[step].Usuario,
          Servicio: this.servicioTiempoComp[step].Servicio,
          Fecha: new Date(this.servicioTiempoComp[step].Fecha),
          "Tiempo Espera": this.servicioTiempoComp[step].Tiempo_Espera,
          "Tiempo Atención": this.servicioTiempoComp[step].Tiempo_Atencion,
        });
      }
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioTiempoComp[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Tiempo completo");
    XLSX.writeFile(
      wb,
      "At-tiempocompleto - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelCliente() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesC || this.seleccionMultiple) {
      for (let step = 0; step < this.clientes.length; step++) {
        jsonServicio.push({
          "N": step+1,
          Sucursal: this.clientes[step].empresa,
          "Cajero(a)": this.clientes[step].usuario,
          Cliente: this.identificacionCliente == 'nombre' ? this.clientes[step].nombre : this.clientes[step].cedula,
          Fecha: new Date(this.clientes[step].fecha),
          Servicio: this.clientes[step].servicio,
          Turno: this.clientes[step].siglas+this.clientes[step].numero,
        });
      }
    }
    else {
      for (let step = 0; step < this.clientes.length; step++) {
        jsonServicio.push({
          "N": step+1,
          "Cajero(a)": this.clientes[step].usuario,
          Cliente: this.identificacionCliente == 'nombre' ? this.clientes[step].nombre : this.clientes[step].cedula,
          Fecha: new Date(this.clientes[step].fecha),
          Servicio: this.clientes[step].servicio,
          Turno: this.clientes[step].siglas+this.clientes[step].numero,
        });
      }
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.clientes[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Cliente");
    XLSX.writeFile(
      wb,
      "At-cliente - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelPromAtencion() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesPA || this.seleccionMultiple) {
      for (let step = 0; step < this.serviciopa.length; step++) {
        jsonServicio.push({
          Sucursal: this.serviciopa[step].nombreEmpresa,
          Servicios: this.serviciopa[step].SERV_NOMBRE,
          Fecha: new Date(this.serviciopa[step].TURN_FECHA),
          "T. Promedio de Espera": this.serviciopa[step].PromedioEspera,
          "T. Promedio de Atención": this.serviciopa[step].PromedioAtencion,
        });
      }
    }
    else {
      for (let step = 0; step < this.serviciopa.length; step++) {
        jsonServicio.push({
          Servicios: this.serviciopa[step].SERV_NOMBRE,
          Fecha: new Date(this.serviciopa[step].TURN_FECHA),
          "T. Promedio de Espera": this.serviciopa[step].PromedioEspera,
          "T. Promedio de Atención": this.serviciopa[step].PromedioAtencion,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciopa[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Promedio");
    XLSX.writeFile(
      wb,
      "promediosatencion - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelTiempoAtencion() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesTA || this.seleccionMultiple) {
      for (let step = 0; step < this.serviciota.length; step++) {
        jsonServicio.push({
          Sucursal: this.serviciota[step].nombreEmpresa,
          "Cajero(a)": this.serviciota[step].cajero,
          Fecha: new Date(this.serviciota[step].TURN_FECHA),
          Hora: this.serviciota[step].hora,
          Servicio: this.serviciota[step].SERV_NOMBRE,
          Turno: this.serviciota[step].turno,
          "Tiempo de espera": this.serviciota[step].espera,
          "Tiempo de atención": this.serviciota[step].atencion,
        });
      }
    }
    else {
      for (let step = 0; step < this.serviciota.length; step++) {
        jsonServicio.push({
          "Cajero(a)": this.serviciota[step].cajero,
          Fecha: new Date(this.serviciota[step].TURN_FECHA),
          Hora: this.serviciota[step].hora,
          Servicio: this.serviciota[step].SERV_NOMBRE,
          Turno: this.serviciota[step].turno,
          "Tiempo de espera": this.serviciota[step].espera,
          "Tiempo de atención": this.serviciota[step].atencion,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciota[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Turnos");
    XLSX.writeFile(
      wb,
      "timepoatencion - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelMaxAtencion() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesMA || this.seleccionMultiple) {
      for (let step = 0; step < this.serviciomax.length; step++) {
        jsonServicio.push({
          Sucursal: this.serviciomax[step].nombreEmpresa,
          Servicio: this.serviciomax[step].SERV_NOMBRE,
          Fecha: new Date(this.serviciomax[step].Fecha),
          "T. Máximo de Atención": this.serviciomax[step].Maximo,
        });
      }
    }
    else {
      for (let step = 0; step < this.serviciomax.length; step++) {
        jsonServicio.push({
          Servicio: this.serviciomax[step].SERV_NOMBRE,
          Fecha: new Date(this.serviciomax[step].Fecha),
          "T. Máximo de Atención": this.serviciomax[step].Maximo,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciomax[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Maximos");
    XLSX.writeFile(
      wb,
      "maximosatencion - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelAtServ() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesAS || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioatser.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioatser[step].nombreEmpresa,
          Nombre: this.servicioatser[step].Nombre,
          Servicio: this.servicioatser[step].Servicio,
          Atendidos: this.servicioatser[step].Atendidos,
          "No atendidos": this.servicioatser[step].NoAtendidos,
          Total: this.servicioatser[step].total,
        });
      }
    }
    else {
      for (let step = 0; step < this.servicioatser.length; step++) {
        jsonServicio.push({
          Nombre: this.servicioatser[step].Nombre,
          Servicio: this.servicioatser[step].Servicio,
          Atendidos: this.servicioatser[step].Atendidos,
          "No atendidos": this.servicioatser[step].NoAtendidos,
          Total: this.servicioatser[step].total,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioatser[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Atencion servicio");
    XLSX.writeFile(
      wb,
      "atencionservicio - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelGraServ() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let step = 0; step < this.serviciograf.length; step++) {
      const item = {
        ...(this.todasSucursalesGS || this.seleccionMultiple
          ? {Sucursal: this.serviciograf[step].nombreEmpresa}
          : {}),
          Servicio: this.serviciograf[step].Servicio,
          Atendidos: this.serviciograf[step].Atendidos,
          "No atendidos": this.serviciograf[step].No_Atendidos,
          Total: this.serviciograf[step].Total,
      };
      jsonServicio.push(item);
    }
    
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciograf[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Atencion - Servicios");
    XLSX.writeFile(
      wb,
      "GraficoAtencion - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  /** ***************************************************************************************************** **
   ** **                                                 PDF                                             ** ** 
   ** ***************************************************************************************************** **/
 
  generarPdfTiempoComp(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtTC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTC.nativeElement.value.toString().trim();
    let documentDefinition;
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    if (pdf === 1) {
      documentDefinition = this.getDocumentTiempoCompleto(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentTiempoCompleto(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Atención Tiempo Completo",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
        this.tiempocompleto(this.servicioTiempoComp),
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  tiempocompleto(servicio: any[]) {
    if (this.todasSucursalesTC || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Tiempo Espera", style: "tableHeader" },
              { text: "Tiempo Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Tiempo_Espera },
                { style: "itemsTable", text: res.Tiempo_Atencion },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
    else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Tiempo Espera", style: "tableHeader" },
              { text: "Tiempo Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Tiempo_Espera },
                { style: "itemsTable", text: res.Tiempo_Atencion },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfCliente(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtC.nativeElement.value.toString().trim();
    let documentDefinition;
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    if (pdf === 1) {
      documentDefinition = this.getDocumentCliente(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentCliente(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Atención Cliente",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
        this.cliente(this.clientes),
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  cliente(servicio: any[]) {
    if (this.todasSucursalesC || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["auto","*", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "N°", style: "tableHeader" },
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Cliente", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Turno", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: servicio.indexOf(res)+1 },
                { style: "itemsTable", text: res.empresa },
                { style: "itemsTable", text: res.usuario },
                { style: "itemsTable", text: this.identificacionCliente=='nombre'?res.nombre:res.cedula },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.servicio },
                { style: "itemsTable", text: res.siglas+res.numero },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
    else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["auto","*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "N°", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Cliente", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Turno", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: servicio.indexOf(res)+1 },
                { style: "itemsTable", text: res.usuario },
                { style: "itemsTable", text: res.cedula },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.servicio },
                { style: "itemsTable", text: res.siglas+res.numero },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfPromAtencion(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateAtPA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtPA.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentPromedioAtencion(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentPromedioAtencion(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Promedio de Atención",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
        this.promediosatencion(this.serviciopa),
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  promediosatencion(servicio: any[]) {
    if (this.todasSucursalesPA || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "T. Promedio de Espera", style: "tableHeader" },
              { text: "T. Promedio de Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.TURN_FECHA },
                { style: "itemsTable", text: res.PromedioEspera },
                { style: "itemsTable", text: res.PromedioAtencion },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    } else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Servicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "T. Promedio de Espera", style: "tableHeader" },
              { text: "T. Promedio de Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.TURN_FECHA },
                { style: "itemsTable", text: res.PromedioEspera },
                { style: "itemsTable", text: res.PromedioAtencion },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }
  
  generarPdfTiempoAtencion(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateAtTA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTA.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentTiempoAtencion(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentTiempoAtencion(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Tiempo de atención",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
        this.tiempoAtencion(this.serviciota),
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  tiempoAtencion(servicio: any[]) {
    if (this.todasSucursalesTA || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Hora", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Turno", style: "tableHeader" },
              { text: "Tiempo de espera", style: "tableHeader" },
              { text: "Tiempo de atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.cajero },
                { style: "itemsTable", text: res.TURN_FECHA },
                { style: "itemsTable", text: res.hora },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.turno },
                { style: "itemsTable", text: res.espera },
                { style: "itemsTable", text: res.atencion },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    } else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto" ,"auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Hora", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Turno", style: "tableHeader" },
              { text: "Tiempo de espera", style: "tableHeader" },
              { text: "Tiempo de atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.cajero },
                { style: "itemsTable", text: res.TURN_FECHA },
                { style: "itemsTable", text: res.hora },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.turno },
                { style: "itemsTable", text: res.espera },
                { style: "itemsTable", text: res.atencion },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfMaxAtencion(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtMA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtMA.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentMaxAtencion(fechaDesde, fechaHasta);
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  getDocumentMaxAtencion(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Máximos de Atención",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        this.maxatencion(this.serviciomax), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  maxatencion(servicio: any[]) {
    if (this.todasSucursalesMA || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "T. Promedio de Espera", style: "tableHeader" },
              { text: "T. Promedio de Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Maximo },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
    else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto"],
          body: [
            [
              { text: "Servicio", style: "tableHeader" },
              { text: "T. Promedio de Espera", style: "tableHeader" },
              { text: "T. Promedio de Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Maximo },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfAtServ(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtAS.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtAS.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionServicio(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACIÓN
  getDocumentAtencionServicio(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Atención servicio",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        this.atencionservicio(this.servicioatser), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  atencionservicio(servicio: any[]) {
    if (this.todasSucursalesAS || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal.", style: "tableHeader" },
              { text: "Nombre.", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Nombre },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Atendidos },
                { style: "itemsTable", text: res.NoAtendidos },
                { style: "itemsTable", text: res.total },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
    else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nombre.", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Nombre },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Atendidos },
                { style: "itemsTable", text: res.NoAtendidos },
                { style: "itemsTable", text: res.total },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfGraServ(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateAtG.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtG.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionServicioGraf(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case "open":
        pdfMake.createPdf(documentDefinition).open();
        break;
      case "print":
        pdfMake.createPdf(documentDefinition).print();
        break;
      case "download":
        pdfMake.createPdf(documentDefinition).download();
        break;

      default:
        pdfMake.createPdf(documentDefinition).open();
        break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentAtencionServicioGraf(fechaDesde: any, fechaHasta: any) {
    // SELECCIONA DE LA INTERFAZ EL ELEMENTO QUE CONTIENE LA GRAFICA
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    var canvasImg = canvas1.toDataURL("image/png");

    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      watermark: {
        text: this.marca,
        color: "blue",
        opacity: 0.1,
        bold: true,
        italics: false,
        fontSize: 52,
      },
      header: {
        text: "Impreso por:  " + this.userDisplayName,
        margin: 10,
        fontSize: 9,
        opacity: 0.3,
      },
      pageOrientation: this.orientacion,
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              "Fecha: " + fecha + " Hora: " + timer,
              {
                text: [
                  {
                    text:
                      "© Pag " + currentPage.toString() + " of " + pageCount,
                    alignment: "right",
                    color: "blue",
                    opacity: 0.5,
                  },
                ],
              },
            ],
            fontSize: 9,
            color: "#A4B8FF",
          },
        ];
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
              width: "*",
              alignment: "center",
              text: "Reporte - Gráfico Atención Servicios",
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            },
          ],
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: "subtitulos",
          text: "Periodo de " + fechaDesde + " hasta " + fechaHasta,
        },
        this.atenciongrafservicio(this.serviciograf),
        this.grafico(canvasImg), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableTotal: {
          fontSize: 30,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          alignment: "center",
          fillColor: this.p_color,
        },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: {
          fontSize: 12,
          alignment: "center",
          margin: [0, 8, 0, 8],
          fillColor: this.p_color,
        },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: "blue", opacity: 0.5 },
      },
    };
  }

  grafico(imagen: any) {
    if (this.orientacion == "landscape") {
      return {
        image: imagen,
        fit: [800, 500],
        margin: [0, 50, 0, 10],
        alignment: "center",
        pageBreak: 'before'
      };
    } else {
      return {
        image: imagen,
        fit: [500, 350],
        margin: [0, 50, 0, 10],
        alignment: "center",
      };
    }
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  atenciongrafservicio(servicio: any[]) {
    if (this.todasSucursalesGS || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Atendidos },
                { style: "itemsTable", text: res.No_Atendidos },
                { style: "itemsTable", text: res.Total },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    } else {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Servicio.", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Atendidos },
                { style: "itemsTable", text: res.No_Atendidos },
                { style: "itemsTable", text: res.Total },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex: any) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPDFGrafico() {
    // SELECCIONA DE LA INTERFAZ EL ELEMENTO QUE CONTIENE LA GRAFICA
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    var canvasImg = canvas1.toDataURL("image/png");
    // CREA PDF
    var doc = new jsPDF("l", "mm", "a4");
    // SE OBTIENE EL LARGO Y ANCHO DE LA PAGINA ESTE CASO A4
    let pageWidth = doc.internal.pageSize.getWidth();
    let pageHeight = doc.internal.pageSize.getHeight();

    // OBTIENE FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    var fecha = f.toJSON().split("T")[0];
    var timer = f.toJSON().split("T")[1].slice(0, 5);
    // OBTIENE EL CENTRO SUPERIOR DE LA PAGINA
    let textEnc = "Reporte - Gráfico Atención Servicios";
    let textEncWidth =
      (doc.getStringUnitWidth(textEnc) * doc.getFontSize()) /
      doc.internal.scaleFactor;
    let xTextEnc = (pageWidth - textEncWidth) / 2;
    // IMPRIME FECHA, ENCABEZADO, PIE DE PAGINA RESPECTIVAMENTE
    doc.text("Fecha: " + fecha + " Hora: " + timer, 5, pageHeight - 10);
    doc.text(textEnc, xTextEnc, 10);
    doc.text("Impreso por: " + this.userDisplayName, 200, pageHeight - 10);
    // AÑADE IMAGEN EN EL CENTRO DEL DOCUMENTO
    doc.addImage(canvasImg, "PNG", 10, 10, 280, 150);
    // GUARDA PDF CON UN NOMBRE PROPUESTO
    doc.save(`Gráfico-Atención ${fecha}, ${timer}.pdf`);
    window.open(URL.createObjectURL(doc.output("blob")));
  }
}
