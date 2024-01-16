import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { saveAs } from 'file-saver';
import { Utils } from "../../utils/util";

import { ServiceService } from "../../services/service.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from "../../services/authentication.service";

// COMPLEMENTO PARA GRAFICOS
import { Chart } from "chart.js";
// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import jsPDF from "jspdf";
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
import * as XLSX from "xlsx";
const EXCEL_EXTENSION = ".xlsx";

@Component({
  selector: "app-evaluacion",
  templateUrl: "./evaluacion.component.html",
  styleUrls: ["./evaluacion.component.scss"],
})

export class EvaluacionComponent implements OnInit {
  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("contentEvalEmpl") contentEvalEmpl: ElementRef;
  @ViewChild("TABLEEvalEmpl", { static: false }) TABLEEvalEmpl: ElementRef;
  @ViewChild("contentEvalOmitidas") contentEvalOmitidas: ElementRef;
  @ViewChild("TABLEEvalOmitidas", { static: false })
  TABLEEvalOmitidas: ElementRef;
  @ViewChild("contentEvalMMEmpl") contentEvalMMEmpl: ElementRef;
  @ViewChild("TABLEEvalMMEmpl", { static: false }) TABLEEvalMMEmpl: ElementRef;

  @ViewChild("fromDateEstb") fromDateEstb: ElementRef;
  @ViewChild("toDateEstb") toDateEstb: ElementRef;
  @ViewChild("fromDateServicios") fromDateServicios: ElementRef;
  @ViewChild("toDateServicios") toDateServicios: ElementRef;
  @ViewChild("fromDateDesdeEvalEmpl") fromDateDesdeEvalEmpl: ElementRef;
  @ViewChild("toDateHastaEvalEmpl") toDateHastaEvalEmpl: ElementRef;
  @ViewChild("fromDateDesdeEvalOmitidas") fromDateDesdeEvalOmitidas: ElementRef;
  @ViewChild("toDateHastaEvalOmitidas") toDateHastaEvalOmitidas: ElementRef;
  @ViewChild("fromDateDesdeEvalGr") fromDateDesdeEvalGr: ElementRef;
  @ViewChild("toDateHastaEvalGr") toDateHastaEvalGr: ElementRef;
  @ViewChild("fromDateDesdeEvalGra") fromDateDesdeEvalGra: ElementRef;
  @ViewChild("toDateHastaEvalGra") toDateHastaEvalGra: ElementRef;
  @ViewChild("codServicioServs") codServicioServs: ElementRef;
  @ViewChild("codCajeroEvalEmpl") codCajeroEvalEmpl: ElementRef;
  @ViewChild("codCajeroEvalOmitidas") codCajeroEvalOmitidas: ElementRef;
  @ViewChild("codCajeroEvalGr") codCajeroEvalGr: ElementRef;
  @ViewChild("codCajeroEvalGra") codCajeroEvalGra: ElementRef;
  @ViewChild('codSucursalServicio') codSucursalServicio: ElementRef;
  @ViewChild('codSucursalEvalEmpl') codSucursalEvalEmpl: ElementRef;
  @ViewChild('codSucursalEvalGr') codSucursalEvalGr: ElementRef;
  @ViewChild('codSucursalEvalOmitidas') codSucursalEvalOmitidas: ElementRef;
  @ViewChild('codSucursalEst') codSucursalEst: ElementRef;
  @ViewChild('codSucursal') codSucursal: ElementRef;

  @ViewChild("horaInicioS") horaInicioS: ElementRef;
  @ViewChild("horaFinS") horaFinS: ElementRef;
  @ViewChild("horaInicioC") horaInicioC: ElementRef;
  @ViewChild("horaFinC") horaFinC: ElementRef;
  @ViewChild("horaInicioA") horaInicioA: ElementRef;
  @ViewChild("horaFinA") horaFinA: ElementRef;
  @ViewChild("horaInicioAG") horaInicioAG: ElementRef;
  @ViewChild("horaFinAG") horaFinAG: ElementRef;
  @ViewChild("horaInicioO") horaInicioO: ElementRef;
  @ViewChild("horaFinO") horaFinO: ElementRef;
  @ViewChild("horaInicioG") horaInicioG: ElementRef;
  @ViewChild("horaFinG") horaFinG: ElementRef;


  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioServs: any = [];
  servicioServsMaxMin: any = [];
  serviciosServs: any = [];
  servicio2: any;
  servicio3: any;
  servicioEstb: any = [];
  servicio5: any;
  servicioe: any;
  servicioEvalEmpl: any = [];
  servicioEvalOmitidas: any = [];
  servicioEvalMMEmpl: any = [];
  servicioG: any = [];
  servicioGra: any = [];
  cajerosEval: any = [];
  cajerosEvalOmitidas: any = [];
  cajerosG: any = [];
  sucursales: any[];
  opciones: any[];
  // CAMBIO DE TIPO DE GRAFICO Y VARIABLE PARA GUARDAR EL USUARIO LOGUEADo
  tipo: string;
  chart: any;
  userDisplayName: any;
  // PARAMETRO PARA EXCEL
  p_color: any;
  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesS: boolean = false;
  todasSucursalesE: boolean = false;
  todasSucursalesEG: boolean = false;
  todasSucursalesG: boolean = false;
  todasSucursalesEST: boolean = false;
  todasSucursalesEO: boolean = false;
  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestS: boolean = false;
  malRequestSPag: boolean = false;
  malRequestMaxMin: boolean = false;
  malRequestMaxMinPag: boolean = false;
  malRequestE: boolean = false;
  malRequestEPag: boolean = false;
  malRequestEOmitidas: boolean = false;
  malRequestEOmitidasPag: boolean = false;
  malRequestG: boolean = false;
  malRequestGPag: boolean = false;
  malRequestGra: boolean = false;
  malRequestGraPag: boolean = false;
  malRequestEstb: boolean = false;
  malRequestEstbPag: boolean = false;
  // CONTROL DE OPCIONES DE EVALUACION
  opcionCuatro: boolean = false;
  // CONTROL PAGINACION
  configS: any;
  configSMM: any;
  configE: any;
  configEOmitidas: any;
  configEMM: any;
  configEG: any;
  configG: any;
  configEstb: any;

  // MAXIMO DE ITEMS MOSTRADO DE TABLA EN PANTALLA
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };

  // OBTIENE FECHA ACTUAL PARA COLOCARLO EN CUADRO DE FECHA
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year + "-" + this.month + "-" + this.day;

  // IMAGEN LOGO
  urlImagen: string;

  // OPCIONES MULTIPLES
  allSelected: boolean = false;
  selectedItems: string[] = [];
  sucursalesSeleccionadas: string[] = [];
  seleccionMultiple: boolean = false;

  // MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  // MOSTRAR SERVICIOS
  mostrarServicios: boolean = false;

  // ORIENTACION
  orientacion: string;

  // INFORMACION
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  constructor(
    private imagenesService: ImagenesService,
    private serviceService: ServiceService,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configS = {
      id: "Evals",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioServs.length,
    };
    this.configSMM = {
      id: "Evalsmm",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioServsMaxMin.length,
    };
    this.configE = {
      id: "Evale",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioEvalEmpl.length,
    };

    this.configEOmitidas = {
      id: "Evaleomitidas",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioEvalOmitidas.length,
    };

    this.configEMM = {
      id: "Evalemm",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioEvalMMEmpl.length,
    };
    this.configEG = {
      id: "Evaleg",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioG.length,
    };
    this.configG = {
      id: "Evalg",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioGra.length,
    };
    this.configEstb = {
      id: "EvalEstb",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioEstb.length,
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedS(event: any) {
    this.configS.currentPage = event;
  }
  pageChangedSMM(event: any) {
    this.configSMM.currentPage = event;
  }
  pageChangedE(event: any) {
    this.configE.currentPage = event;
  }

  pageChangedEOmitidas(event: any) {
    this.configEOmitidas.currentPage = event;
  }

  pageChangedEMM(event: any) {
    this.configEMM.currentPage = event;
  }
  pageChangedEG(event: any) {
    this.configEG.currentPage = event;
  }
  pageChangedG(event: any) {
    this.configG.currentPage = event;
  }
  pageChangedEstb(event: any) {
    this.configEstb.currentPage = event;
  }

  ngOnInit(): void {
    // CARGAMOS LAS OPCIONES DE EVALUACION
    this.getOpcionesEvaluacion();
    // CARGAMOS COMPONENTES SELECTS HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestSPag = true;
    this.malRequestMaxMinPag = true;
    this.malRequestEPag = true;
    this.malRequestEOmitidasPag = true;
    this.malRequestGPag = true;
    this.malRequestGraPag = true;
    this.malRequestEstb = true;
    this.malRequestEstbPag = true;
    // SETEO DE GRAFICO POR DEFECTO
    this.tipo = "bar";
    // SETEO ORIENTACION
    this.orientacion = "portrait";
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
      case 'todasSucursalesEST':
        this.todasSucursalesEST = !this.todasSucursalesEST;
        break;
      case 'todasSucursalesE':
        this.todasSucursalesE = !this.todasSucursalesE;
        this.todasSucursalesE ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      case 'todasSucursalesEG':
        this.todasSucursalesEG = !this.todasSucursalesEG;
        this.todasSucursalesEG ? this.getCajerosG(this.sucursalesSeleccionadas) : null;
        break;
      case 'todasSucursalesG':
        this.todasSucursalesG = !this.todasSucursalesG;
        this.todasSucursalesG ? this.getCajerosG(this.sucursalesSeleccionadas) : null;
        break;
      case 'todasSucursalesEO':
        this.todasSucursalesEO = !this.todasSucursalesEO;
        this.todasSucursalesEO ? this.getCajerosOmitidas(this.sucursalesSeleccionadas) : null;
        break;
      case 'todasSucursalesS':
        this.todasSucursalesS = !this.todasSucursalesS;
        this.todasSucursalesS ? this.getServicios(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadas':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadasG':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? this.getCajerosG(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadasEO':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? this.getCajerosOmitidas(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadasS':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? this.getServicios(this.sucursalesSeleccionadas) : null;
        break;
      default:
        break;
    }
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // SE OBTIENE FECHA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  // CONSULTA PARA LLENAR SELECT DE INTERFAZ
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajeros: any) => {
      this.cajerosEval = cajeros.cajeros;
      this.mostrarCajeros = true;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosEval = [];
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

  getCajerosOmitidas(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajerosO: any) => {
      this.cajerosEvalOmitidas = cajerosO.cajeros;
      this.mostrarCajeros = true;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosEvalOmitidas = [];
          this.mostrarCajeros = false;
        }
      });
  }

  getCajerosG(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajerosG: any) => {
      this.cajerosG = cajerosG.cajeros;
      this.mostrarCajeros = true;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosG = [];
          this.mostrarCajeros = false;
        }
      });
  }

  // OBTINENE EL NUMERO DE OPCIONES DE EVALUACION
  getOpcionesEvaluacion() {
    this.serviceService.getOpcionesEvaluacion().subscribe((opcion: any) => {
      this.opciones = opcion.opcion;
      if (this.opciones[0].gene_valor == "0") {
        this.opcionCuatro = true;
      }
    });
  }

  limpiar() {
    this.cajerosEval = [];
    this.selectedItems = [];
    this.serviciosServs = [];
    this.cajerosEvalOmitidas = [];
    this.allSelected = false;
    this.mostrarCajeros = false;
    this.mostrarServicios = false;
    this.todasSucursalesS = false;
    this.todasSucursalesE = false;
    this.todasSucursalesEG = false;
    this.todasSucursalesG = false;
    this.todasSucursalesEST = false;
    this.todasSucursalesEO = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  // OBTIENE LOS SERVICIOS QUE EXISTEN
  getServicios(sucursal: any) {
    this.serviceService.getAllServiciosS(sucursal).subscribe((servicios: any) => {
      this.serviciosServs = servicios.servicios;
      this.mostrarServicios = true;
    },
      (error) => {
        if (error.status == 400) {
          this.serviciosServs = [];
          this.mostrarServicios = false;
        }
      });

      console.log('servicios',this.serviciosServs)
  }

  buscarServicios() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateServicios.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateServicios.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioS.nativeElement.value;
    let horaFin = this.horaFinS.nativeElement.value;

    if (this.selectedItems.length !== 0) {
      // SERVICIOS
      this.serviceService
        .getprmediosservicios(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioServs = servicio.turnos;
            this.malRequestS = false;
            this.malRequestSPag = false;
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            if (this.configS.currentPage > 1) {
              this.configS.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES DE INTERFAZ
              this.servicioServs = null;
              this.malRequestS = true;
              this.malRequestSPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.servicioServs == null) {
                this.configS.totalItems = 0;
              } else {
                this.configS.totalItems = this.servicioServs.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configS = {
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

      // MAX MINS
      this.serviceService
        .getmaxminservicios(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioServsMaxMin = servicio.turnos;
            this.malRequestMaxMin = false;
            this.malRequestMaxMinPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configSMM.currentPage > 1) {
              this.configSMM.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioServsMaxMin = null;
              this.malRequestMaxMin = true;
              this.malRequestMaxMinPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.servicioServsMaxMin == null) {
                this.configSMM.totalItems = 0;
              } else {
                this.configSMM.totalItems = this.servicioServsMaxMin.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configSMM = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );
    } else {
      // SI SE SELECCIONA OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.servicioServs = null;
      this.malRequestS = true;
      this.malRequestSPag = true;

      this.servicioServsMaxMin = null;
      this.malRequestMaxMin = true;
      this.malRequestMaxMinPag = true;
    }
  }

  buscarEvalEmpl() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateDesdeEvalEmpl.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalEmpl.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioC.nativeElement.value;
    let horaFin = this.horaFinC.nativeElement.value;

    if (this.selectedItems.length !== 0) {
      this.serviceService
        .getprmediosempleado(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicioEvalEmpl: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioEvalEmpl = servicioEvalEmpl.turnos;
            this.malRequestE = false;
            this.malRequestEPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configE.currentPage > 1) {
              this.configE.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioEvalEmpl = null;
              this.malRequestE = true;
              this.malRequestEPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.servicioEvalEmpl == null) {
                this.configE.totalItems = 0;
              } else {
                this.configE.totalItems = this.servicioEvalEmpl.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configE = {
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

      this.serviceService
        .getmaxminempleado(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicioEvalMMEmpl: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioEvalMMEmpl = servicioEvalMMEmpl.turnos;
            this.malRequestE = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configEMM.currentPage > 1) {
              this.configEMM.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioEvalEmpl = null;
              this.servicioEvalMMEmpl = null;
              this.malRequestE = true;
              this.malRequestEPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.servicioEvalMMEmpl == null) {
                this.configEMM.totalItems = 0;
              } else {
                this.configEMM.totalItems = this.servicioEvalMMEmpl.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configEMM = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );
    } else {
      // SI ELIGE OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.servicioEvalEmpl = null;
      this.servicioEvalMMEmpl = null;

      this.malRequestE = true;
      this.malRequestEPag = true;
    }
  }

  buscarEvalOmitidas() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateDesdeEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalOmitidas.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioO.nativeElement.value;
    let horaFin = this.horaFinO.nativeElement.value;

    if (this.selectedItems.length !== 0) {
      this.serviceService
        .getevalomitidasempleado(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas)
        .subscribe(
          (servicioEvalOmitidas: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioEvalOmitidas = servicioEvalOmitidas.turnos;
            this.malRequestEOmitidas = false;
            this.malRequestEOmitidasPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configEOmitidas.currentPage > 1) {
              this.configEOmitidas.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioEvalOmitidas = null;
              this.malRequestEOmitidas = true;
              this.malRequestEOmitidasPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.servicioEvalOmitidas == null) {
                this.configEOmitidas.totalItems = 0;
              } else {
                this.configEOmitidas.totalItems =
                  this.servicioEvalOmitidas.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configEOmitidas = {
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
    } else {
      // SI ELIGE OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.servicioEvalOmitidas = null;

      this.malRequestEOmitidas = true;
      this.malRequestEOmitidasPag = true;
    }
  }

  buscarEvalGr() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateDesdeEvalGr.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGr.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioAG.nativeElement.value;
    let horaFin = this.horaFinAG.nativeElement.value;

    if (this.selectedItems.length !== 0) {
      this.serviceService
        .getevalgrupo(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicioG: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioG = servicioG.turnos;
            this.malRequestG = false;
            this.malRequestGPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configEG.currentPage > 1) {
              this.configEG.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioG = null;
              this.malRequestG = true;
              this.malRequestGPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.servicioG == null) {
                this.configEG.totalItems = 0;
              } else {
                this.configEG.totalItems = this.servicioG.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configEG = {
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
    } else {
      // SI SE SELECCIONA OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.servicioG = null;
      this.malRequestG = true;
      this.malRequestGPag = true;
    }
  }

  leerEstablecimientos() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateEstb.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateEstb.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioA.nativeElement.value;
    let horaFin = this.horaFinA.nativeElement.value;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getestablecimiento(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas, this.opcionCuatro.toString()).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioEstb = servicio.turnos;
          this.malRequestEstb = false;
          this.malRequestEstbPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configEstb.currentPage > 1) {
            this.configEstb.currentPage = 1;
          }
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioEstb = null;
            this.malRequestEstb = true;
            this.malRequestEstbPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
            **/
            if (this.servicioEstb == null) {
              this.configEstb.totalItems = 0;
            } else {
              this.configEstb.totalItems = this.servicioEstb.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configEstb = {
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

  leerGraficosevabar() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateDesdeEvalGra.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGra.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioG.nativeElement.value;
    let horaFin = this.horaFinG.nativeElement.value;

    this.malRequestGra = false;


    if (this.selectedItems.length !== 0) {
      this.serviceService
        .getgraficobarrasfiltro(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicioGra: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioGra = servicioGra.turnos;
            this.malRequestGraPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configG.currentPage > 1) {
              this.configG.currentPage = 1;
            }
            // FORMATEO Y MAPEO DE DATOS PARA IMPRIMIR VALORES EN GRAFICO
            let evOrig = this.servicioGra;
            let evaluaciones = (this.selectedItems[0] == "-2" ? ["Todos los usuarios"] : servicioGra.turnos.map((res) => res.usuario));
            let Nombres: string | any[];
            let valNombres: number[];
            let totalPorc: number;
            let porcts: string[] | number[];

            if (this.opcionCuatro) {
              Nombres = ["Excelente", "Bueno", "Regular", "Malo"];
              valNombres = [0, 0, 0, 0];
              totalPorc = 0;
              porcts = [0, 0, 0, 0];
            } else {
              Nombres = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Malo"];
              valNombres = [0, 0, 0, 0, 0];
              totalPorc = 0;
              porcts = [0, 0, 0, 0, 0];
            }

            /** EMPATE PARA OBTENER PORCENTAJES DE NOMBRES QUE NO POSEA LA CONSULTA 
             * (SI UNA CONSULTA NO TIENE MALOS, AQUI SE COMPLETA PARA MOSTRAR MEJOR LOS DATOS AL USUARIO)
             **/
            for (var i = 0; i < Nombres.length; i++) {
              if (evOrig.find((val: any) => val.evaluacion === Nombres[i]) != null) {
                valNombres[i] = evOrig.find(
                  (val: any) => val.evaluacion === Nombres[i]
                ).total;
              }
              totalPorc = totalPorc + valNombres[i];
            }
            for (var i = 0; i < Nombres.length; i++) {
              porcts[i] =
                Math.round(((valNombres[i] * 100) / totalPorc) * 1000) / 1000;
              Nombres[i] = Nombres[i] + "\n" + porcts[i] + "%";
            }
            // SETEO DE TITULO DE GRAFICO
            var titulo = true;
            if (this.tipo == "bar") {
              titulo = false;
            } else {
              titulo = true;
            }

            // CREACION DE CHART [IMAGEN] DE TIPO CANVAS SI ES BAR
            if (this.tipo == "bar") {
              // SE DEFINE PARAMETROS COMO LOS LABELS, DATA, OPCIONES (MOSTRAR EL TITULO O RESPONSIVE)
              this.chart = new Chart("canvas", {
                type: this.tipo,
                data: {
                  labels: Nombres, // EJE X
                  datasets: [
                    {
                      label: "",
                      data: valNombres,
                      backgroundColor: [
                        "rgba(51, 172, 32, 0.4)",
                        "rgba(55, 171, 228, 1)",
                        "rgba(213, 220, 102, 0.77)",
                        "rgba(251, 182, 55, 0.77)",
                        "rgba(149, 148, 204, 0.86)",
                      ],
                    },
                  ],
                },
                options: {
                  plugins: {
                    title: {
                      display: true,
                      text: evaluaciones[0],
                    },
                    legend: {
                      display: false,
                    },
                  },
                  responsive: true,
                  maintainAspectRatio: true,
                },
              });
            } else {
              /** CREACION DE CHART [IMAGEN] DE TIPO CANVAS DE TIPO PIE
               * SE DEFINE PARAMETROS COMO LOS LABELS, DATA, OPCIONES (MOSTRAR EL TITULO O RESPONSIVE)
               **/
              this.chart = new Chart("canvas", {
                type: 'pie',
                data: {
                  labels: Nombres, // EJE X
                  datasets: [
                    {
                      label: evaluaciones[0],
                      data: valNombres, // EJE Y
                      backgroundColor: [
                        "rgba(51, 172, 32, 0.4)",
                        "rgba(55, 171, 228, 1)",
                        "rgba(213, 220, 102, 0.77)",
                        "rgba(251, 182, 55, 0.77)",
                        "rgba(149, 148, 204, 0.86)",
                      ],
                    },
                  ],
                },
                options: {
                  plugins: {
                    title: {
                      display: titulo,
                      text: evaluaciones[0],
                    },
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
                  responsive: true,
                },
              });
            }
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioGra = null;
              this.malRequestGra = true;
              this.malRequestGraPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
               *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
               **/
              if (this.servicioGra == null) {
                this.configG.totalItems = 0;
              } else {
                this.configG.totalItems = this.servicioGra.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACIOn
              this.configG = {
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
      /** SI CHART ES VACIO NO PASE NADA, CASO CONTRARIO SI TIENEN YA DATOS, SE DESTRUYA PARA CREAR UNO NUEVO, 
       *  EVITANDO SUPERPOSISION DEL NUEVO CHART
       **/
      if (this.chart != undefined || this.chart != null) {
        this.chart.destroy();
      }
    }
  }

  // FUNCION QUE DETECTA CAMBIO DE TIPO DE GRAFICO, Y CREA UNO NUEVO
  cambiar(tipo: string) {
    this.tipo = tipo;
    if (this.chart) {
      this.chart.destroy();
    }
    this.leerGraficosevabar();
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

  exportarAExcelServicios() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // SERVICIOS
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioServs.length; i++) {
      const item = {
        ...(this.todasSucursalesS || this.seleccionMultiple
          ? { Sucursal: this.servicioServs[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioServs[i].Usuario,
        Fecha: new Date(this.servicioServs[i].Fecha),
        Excelente: this.servicioServs[i].Excelente,
        ...(!this.opcionCuatro
          ? { "Muy Bueno": this.servicioServs[i].Muy_Bueno }
          : {}),
        Bueno: this.servicioServs[i].Bueno,
        Regular: this.servicioServs[i].Regular,
        Malo: this.servicioServs[i].Malo,
        Total: this.servicioServs[i].Total,
        Promedio: this.servicioServs[i].Promedio,
      };

      jsonServicio.push(item);
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioServs[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");

    // MAX MIN
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicioAux: any = [];

    for (let i = 0; i < this.servicioServsMaxMin.length; i++) {
      const item = {
        ...(this.todasSucursalesS
          ? { Sucursal: this.servicioServsMaxMin[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioServsMaxMin[i].Usuario,
        Fecha: new Date(this.servicioServsMaxMin[i].Fecha),
        Excelente: this.servicioServsMaxMin[i].Excelente,
        ...(!this.opcionCuatro
          ? { "Muy Bueno": this.servicioServsMaxMin[i].Muy_Bueno }
          : {}),
        Bueno: this.servicioServsMaxMin[i].Bueno,
        Regular: this.servicioServsMaxMin[i].Regular,
        Malo: this.servicioServsMaxMin[i].Malo,
        Total: this.servicioServsMaxMin[i].Total,
        Máx: this.servicioServsMaxMin[i].max,
        Mín: this.servicioServsMaxMin[i].min,
      };
      jsonServicioAux.push(item);
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicioAux);
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header1 = Object.keys(this.servicioServsMaxMin[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols1: any = [];
    for (var i = 0; i < header1.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols1.push({ wpx: 150 });
    }
    ws1["!cols"] = wscols1;
    XLSX.utils.book_append_sheet(wb, ws1, "Máximos y Mínimos");
    XLSX.writeFile(
      wb,
      "Servicios - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEvalEmpl() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioEvalEmpl.length; i++) {
      const item = {
        ...(this.todasSucursalesE || this.seleccionMultiple
          ? { Sucursal: this.servicioEvalEmpl[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioEvalEmpl[i].usua_nombre,
        Fecha: new Date(this.servicioEvalEmpl[i].fecha),
        Excelente: this.servicioEvalEmpl[i].Excelente,
        ...(!this.opcionCuatro
          ? { "Muy Bueno": this.servicioEvalEmpl[i].Muy_Bueno }
          : {}),
        Bueno: this.servicioEvalEmpl[i].Bueno,
        Regular: this.servicioEvalEmpl[i].Regular,
        Malo: this.servicioEvalEmpl[i].Malo,
        Total: this.servicioEvalEmpl[i].Total,
        Promedio: this.servicioEvalEmpl[i].Promedio,
      };
      jsonServicio.push(item);
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DE LA HOJA
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEvalEmpl[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Empleado");

    // MAX MIN
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicioAux: any = [];
    for (let i = 0; i < this.servicioEvalMMEmpl.length; i++) {
      const item = {
        ...(this.todasSucursalesE
          ? { Sucursal: this.servicioEvalMMEmpl[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioEvalMMEmpl[i].usua_nombre,
        Fecha: new Date(this.servicioEvalMMEmpl[i].fecha),
        Excelente: this.servicioEvalMMEmpl[i].Excelente,
        ...(!this.opcionCuatro
          ? { "Muy Bueno": this.servicioEvalMMEmpl[i].Muy_Bueno }
          : {}),
        Bueno: this.servicioEvalMMEmpl[i].Bueno,
        Regular: this.servicioEvalMMEmpl[i].Regular,
        Malo: this.servicioEvalMMEmpl[i].Malo,
        Total: this.servicioEvalMMEmpl[i].Total,
        Máx: this.servicioEvalMMEmpl[i].max,
        Mín: this.servicioEvalMMEmpl[i].min,
      };
      jsonServicioAux.push(item);
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicioAux);
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header1 = Object.keys(this.servicioEvalMMEmpl[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols1: any = [];
    for (var i = 0; i < header1.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols1.push({ wpx: 150 });
    }
    ws1["!cols"] = wscols1;
    XLSX.utils.book_append_sheet(wb, ws1, "Máximos y Mínimos Empleado");
    XLSX.writeFile(
      wb,
      "Evaluacion-cajero - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEvalOmitidas() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioEvalOmitidas.length; i++) {
      const item = {
        ...(this.todasSucursalesEO || this.seleccionMultiple
          ? { Sucursal: this.servicioEvalOmitidas[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioEvalOmitidas[i].usua_nombre,
        Fecha: new Date(this.servicioEvalOmitidas[i].fecha),
        Total: this.servicioEvalOmitidas[i].Total,
      };
      jsonServicio.push(item);
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DE LA HOJA
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEvalOmitidas[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "EvaluacionesOmitidas");

    XLSX.writeFile(
      wb,
      "servicio-eval-omitidas - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEstb() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioEstb.length; i++) {
      const item = {
        ...(this.todasSucursalesEST || this.seleccionMultiple
          ? { Sucursal: this.servicioEstb[i].nombreEmpresa }
          : {}),
        Fecha: new Date(this.servicioEstb[i].fecha),
        Excelente: this.servicioEstb[i].Excelente,
        "Muy Bueno": this.servicioEstb[i].Muy_Bueno,
        Bueno: this.servicioEstb[i].Bueno,
        Regular: this.servicioEstb[i].Regular,
        Malo: this.servicioEstb[i].Malo,
        Total: this.servicioEstb[i].Total,
      };
      jsonServicio.push(item);
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEstb[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Agencia");
    XLSX.writeFile(
      wb,
      "Evaluacion-Agencia - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEvalGr() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioG.length; i++) {
      const item = {
        ...(this.todasSucursalesEG || this.seleccionMultiple
          ? { Sucursal: this.servicioG[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioG[i].usua_nombre,
        Fecha: new Date(this.servicioG[i].fecha),
        Bueno: this.servicioG[i].Bueno,
        Malo: this.servicioG[i].Malo,
        Total: this.servicioG[i].Total,
        Promedio: this.servicioG[i].Promedio,
      };
      jsonServicio.push(item);
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioG[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Grupos");
    XLSX.writeFile(
      wb,
      "Evaluacion-Agrupada - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  generarImagen() {
    // SELECCIONA DE LA INTERFAZ EL ELEMENTO QUE CONTIENE LA GRAFICA
    const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    const canvasImg = canvas.toDataURL('image/png');

    // CREA UN BLOB CON LA IMAGEN
    const blob = this.dataURLtoBlob(canvasImg);

    // GUARDA EL BLOB EN UN ARCHIVO
    saveAs(blob, 'grafico.png');

    // LLAMAMOS A LA FUNCIÓN QUE GENERA EL ARCHIVO DE EXCEL Y LE PASAMOS LA RUTA DEL ARCHIVO COMO PARÁMETRO
    this.exportarAExcelGra();

  }

  dataURLtoBlob(dataUrl: string): Blob {
    const arr: any = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  exportarAExcelGra() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];

    for (let i = 0; i < this.servicioGra.length; i++) {
      const item = {
        ...(this.todasSucursalesG || this.seleccionMultiple
          ? { Sucursal: this.servicioGra[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioGra[i].usuario,
        Evaluación: this.servicioGra[i].evaluacion,
        Total: this.servicioGra[i].total,
        Porcentajes: this.servicioGra[i].porcentaje + "%",
      };
      jsonServicio.push(item);
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioGra[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(
      wb,
      "GraficoEvaluaciones - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  // GENERACION DE PDF'S
  generarPdfServicios(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateServicios.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateServicios.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentServicios(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACIÓN EN ESTRUCTURA
  getDocumentServicios(fechaDesde: any, fechaHasta: any) {
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
              width: 75,
              height: 45,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Evaluación por servicio",
              bold: true,
              fontSize: 15,
              margin: [-75, 20, 0, 0],
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
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF SERVICIO Y MAX MIN
        this.opcionCuatro
          ? this.serviciosC(this.servicioServs)
          : this.servicios(this.servicioServs),
        this.opcionCuatro
          ? this.maxminC(this.servicioServsMaxMin)
          : this.maxmin(this.servicioServsMaxMin),
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND SERVICIOS
  servicios(servicio: any[]) {
    if (this.todasSucursalesS || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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
          widths: [
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND MAX MINS
  maxmin(servicio: any[]) {
    if (this.todasSucursalesS || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND SERVICIOS
  serviciosC(servicio: any[]) {
    if (this.todasSucursalesS || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND MAX MINS
  maxminC(servicio: any[]) {
    if (this.todasSucursalesS || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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

  generarPdfEvalEmpl(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateDesdeEvalEmpl.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalEmpl.nativeElement.value
      .toString()
      .trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEmpleado(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION DE ESTRUCTURA
  getDocumentEmpleado(fechaDesde: any, fechaHasta: any) {
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
              text:
                "Reporte" + "\n" + " Evaluación por cajero",
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
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF EMPLEADO Y MAX, MIN
        this.opcionCuatro
          ? this.empleadoC(this.servicioEvalEmpl)
          : this.empleado(this.servicioEvalEmpl),
        this.opcionCuatro
          ? this.maxmineC(this.servicioEvalMMEmpl)
          : this.maxmine(this.servicioEvalMMEmpl),
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  empleado(servicio: any[]) {
    if (this.todasSucursalesE || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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
          widths: [
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  maxmine(servicio: any[]) {
    if (this.todasSucursalesE || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  empleadoC(servicio: any[]) {
    if (this.todasSucursalesE || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  maxmineC(servicio: any[]) {
    if (this.todasSucursalesE || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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
          Label: "Maximos y minimos",
          headerRows: 1,
          widths: [
            "*",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Max.", style: "tableHeader" },
              { text: "Min.", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.max },
                { style: "itemsTable", text: res.min },
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

  generarPdfEvalOmitidas(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateDesdeEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEvaluacionesOmitidas(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACIÓN DE ESTRUCTURA
  getDocumentEvaluacionesOmitidas(fechaDesde: any, fechaHasta: any) {
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
              text: "Reporte" + "\n" + "Evaluaciones omitidas",
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
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF EVALUACIONES OMITIDAS
        this.omitidas(this.servicioEvalOmitidas),
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  omitidas(servicio: any[]) {
    if (this.todasSucursalesEO || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
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
          widths: ["*", "auto", "auto"],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
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

  generarPdfEstb(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateEstb.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateEstb.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEstablecimiento(
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
  getDocumentEstablecimiento(fD: any, fH: any) {
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
        text: "Impreso por: " + this.userDisplayName,
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
              text: "Reporte - Evaluación por agencia",
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
          text: "Periodo de " + fD + " hasta " + fH,
        },
        this.opcionCuatro
          ? this.establecimientosC(this.servicioEstb)
          : this.establecimientos(this.servicioEstb), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF EN ESTRUCTURA
  establecimientos(servicio: any[]) {
    if (this.todasSucursalesEST || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Muy Bueno", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Muy_Bueno },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF EN ESTRUCTURA
  establecimientosC(servicio: any[]) {
    if (this.todasSucursalesEST || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Fecha", style: "tableHeader" },
              { text: "Excelente", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Regular", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Excelente },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Regular },
                { style: "itemsTable", text: res.Malo },
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

  generarPdfEvalGr(action = "open", pdf: number) {
     // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateDesdeEvalGr.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGr.nativeElement.value
      .toString()
      .trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEvaGrupo(
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
  getDocumentEvaGrupo(fechaDesde: any, fechaHasta: any) {
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
              text: "Reporte - Evaluación agrupada por calificación",
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
        this.evagrupo(this.servicioG), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  evagrupo(servicio: any[]) {
    if (this.todasSucursalesEG || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Nombre", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nombre", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Bueno", style: "tableHeader" },
              { text: "Malo", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Promedio", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usua_nombre },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Bueno },
                { style: "itemsTable", text: res.Malo },
                { style: "itemsTable", text: res.Total },
                { style: "itemsTable", text: res.Promedio },
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

  // PDF DE GRAFICOS
  generarPdfGra(action = "open", pdf: number) {
     // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateDesdeEvalGra.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGra.nativeElement.value
      .toString()
      .trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentGr(fechaDesde, fechaHasta);
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
  getDocumentGr(fechaDesde, fechaHasta) {
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    var canvasImg = canvas1.toDataURL("image/png");
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    // FORMATEO DE DATOS PARA OBTENER, LOS VALORES DE CADA PARÁMETRO
    let Nombres: any = [];
    let valNombres: any = [];

    if (this.opcionCuatro) {
      Nombres = ["Excelente", "Bueno", "Regular", "Malo"];
      valNombres = [0, 0, 0, 0];
    } else {
      Nombres = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Malo"];
      valNombres = [0, 0, 0, 0, 0];
    }

    for (var i = 0; i < Nombres.length; i++) {
      if (
        this.servicioGra.find((val) => val.evaluacion === Nombres[i]) != null
      ) {
        valNombres[i] = this.servicioGra.find(
          (val) => val.evaluacion === Nombres[i]
        ).total;
      }
    }

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
              text: "Reporte - Gráfico Evaluaciones",
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
        this.grafico(this.servicioGra),
        this.graficoImagen(canvasImg), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  graficoImagen(imagen: any) {
    if (this.orientacion == "landscape") {
      return {
        image: imagen,
        fit: [800, 500],
        margin: [0, 50, 0, 10],
        alignment: "center",
        pageBreak: "before",
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF la estructura
  grafico(servicio: any[]) {
    if (this.todasSucursalesG || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Evaluacion", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Porcentajes", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.usuario },
                { style: "itemsTable", text: res.evaluacion },
                { style: "itemsTable", text: res.total },
                { style: "itemsTable", text: res.porcentaje + "%" },
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
          widths: ["*", "*", "*", "*"],
          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Evaluacion", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Porcentajes", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usuario },
                { style: "itemsTable", text: res.evaluacion },
                { style: "itemsTable", text: res.total },
                { style: "itemsTable", text: res.porcentaje + "%" },
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

  genGraficoPDF() {
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
    let textEnc = "Reporte - Gráfico Evaluaciones";
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
    doc.save(`Gráfico-Evaluaciones ${fecha}, ${timer}.pdf`);
    window.open(URL.createObjectURL(doc.output("blob")));
  }
}
