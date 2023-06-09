import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ServiceService } from "../../services/service.service";
import { AuthenticationService } from "../../services/authentication.service";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";

//Complemento para graficos
import { Chart } from "chart.js";
//Complementos para PDF y Excel
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { Utils } from "../../utils/util";

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const EXCEL_EXTENSION = ".xlsx";

@Component({
  selector: "app-evaluacion",
  templateUrl: "./evaluacion.component.html",
  styleUrls: ["./evaluacion.component.scss"],
})
export class EvaluacionComponent implements OnInit {
  //Seteo de fechas primer dia del mes actual y dia actual
  fromDate;
  toDate;
  //captura de elementos de la interfaz visual para tratarlos y capturar datos
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

  //Servicios-Variables donde se almacenaran las consultas a la BD
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
  //Cambio de tipo de grafico y variable para guardar el usuario logueado
  tipo: string;
  chart: any;
  userDisplayName: any;
  //parametro para Excel
  p_color: any;
  //Banderas para mostrar la tabla correspondiente a las consultas
  todasSucursalesS: boolean = false;
  todasSucursalesE: boolean = false;
  todasSucursalesEG: boolean = false;
  todasSucursalesG: boolean = false;
  todasSucursalesEST: boolean = false;
  todasSucursalesEO: boolean = false;
  //Banderas para que no se quede en pantalla consultas anteriores
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
  //Control paginacion
  configS: any;
  configSMM: any;
  configE: any;
  configEOmitidas: any;
  configEMM: any;
  configEG: any;
  configG: any;
  configEstb: any;
  //Maximo de items mostrado de tabla en pantalla
  private MAX_PAGS = 10;
  //Palabras de componente de paginacion
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };

  //Obtiene fecha actual para colocarlo en cuadro de fecha
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year + "-" + this.month + "-" + this.day;
  //Imagen Logo
  urlImagen: string;

  //Orientacion
  orientacion: string;

  constructor(
    private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router,
    public datePipe: DatePipe
  ) {
    //Seteo de item de paginacion cuantos items por pagina, desde que pagina empieza, el total de items respectivamente
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
  }
  //Eventos para avanzar o retroceder en la paginacion
  pageChangedS(event) {
    this.configS.currentPage = event;
  }
  pageChangedSMM(event) {
    this.configSMM.currentPage = event;
  }
  pageChangedE(event) {
    this.configE.currentPage = event;
  }

  pageChangedEOmitidas(event) {
    this.configEOmitidas.currentPage = event;
  }

  pageChangedEMM(event) {
    this.configEMM.currentPage = event;
  }
  pageChangedEG(event) {
    this.configEG.currentPage = event;
  }
  pageChangedG(event) {
    this.configG.currentPage = event;
  }
  pageChangedEstb(event) {
    this.configEstb.currentPage = event;
  }

  ngOnInit(): void {
    //Cargamos componentes selects HTML
    this.getlastday();
    this.getServicios("-1");
    this.getCajeros("-1");
    this.getCajerosG("-1");
    this.getCajerosOmitidas("-1");
    this.getSucursales();
    //Cargamos nombre de usuario logueado
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    //Seteo de banderas cuando el resultado de la peticion HTTP no es 200 OK
    this.malRequestSPag = true;
    this.malRequestMaxMinPag = true;
    this.malRequestEPag = true;
    this.malRequestEOmitidasPag = true;
    this.malRequestGPag = true;
    this.malRequestGraPag = true;
    this.malRequestEstb = true;
    this.malRequestEstbPag = true;
    //Seteo de grafico por defecto
    this.tipo = "bar";
    //seteo orientacion
    this.orientacion = "portrait";
    //Seteo de imagen en interfaz
    Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
      (result) => (this.urlImagen = result)
    );
  }

  //Se obtiene fecha actual
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  //Se desloguea de la aplicacion
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  //Consulta para llenar select de interfaz
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajeros: any) => {
      this.cajerosEval = cajeros.cajeros;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosEval = [];
        }
      });
  }

  //Consulata para llenar la lista de surcursales.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  getCajerosOmitidas(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajerosO: any) => {
      this.cajerosEvalOmitidas = cajerosO.cajeros;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosEvalOmitidas = [];
        }
      });
  }

  getCajerosG(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajerosG: any) => {
      this.cajerosG = cajerosG.cajeros;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosG = [];
        }
      });
  }

  limpiar() {
    this.getCajeros("-1");
    this.getCajerosG("-1");
    this.getCajerosOmitidas("-1");
    this.getSucursales();
    this.getServicios("-1");
  }

  //Comprueba si se realizo una busqueda por sucursales
  comprobarBusquedaSucursales(cod: string) {
    console.log(cod);
    return cod == "-1" ? true : false;
  }

  //cambio orientacion
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  //Obtiene los servicios que existen
  getServicios(sucursal: any) {
    this.serviceService.getAllServiciosS(sucursal).subscribe((servicios: any) => {
      this.serviciosServs = servicios.servicios;
    },
      (error) => {
        if (error.status == 400) {
          this.serviciosServs = [];
        }
      });
  }

  buscarServicios() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateServicios.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateServicios.nativeElement.value.toString().trim();
    var serv = this.codServicioServs.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalServicio.nativeElement.value.toString().trim();

    if (serv != "-1") {
      //Servicios
      this.serviceService
        .getprmediosservicios(fechaDesde, fechaHasta, parseInt(serv))
        .subscribe(
          (servicio: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioServs = servicio.turnos;
            this.malRequestS = false;
            this.malRequestSPag = false;
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            if (this.configS.currentPage > 1) {
              this.configS.currentPage = 1;
            }
            this.todasSucursalesS = this.comprobarBusquedaSucursales(codSucursal);
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles de interfaz
              this.servicioServs = null;
              this.malRequestS = true;
              this.malRequestSPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioServs == null) {
                this.configS.totalItems = 0;
              } else {
                this.configS.totalItems = this.servicioServs.length;
              }
              //Por error 400 se setea elementos de paginacion
              this.configS = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );

      //Max Mins
      this.serviceService
        .getmaxminservicios(fechaDesde, fechaHasta, parseInt(serv))
        .subscribe(
          (servicio: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioServsMaxMin = servicio.turnos;
            this.malRequestMaxMin = false;
            this.malRequestMaxMinPag = false;
            //Seteo de paginacion cuando se hace una nueva busqueda
            if (this.configSMM.currentPage > 1) {
              this.configSMM.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
              this.servicioServsMaxMin = null;
              this.malRequestMaxMin = true;
              this.malRequestMaxMinPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioServsMaxMin == null) {
                this.configSMM.totalItems = 0;
              } else {
                this.configSMM.totalItems = this.servicioServsMaxMin.length;
              }
              //Por error 400 se setea elementos de paginacion
              this.configSMM = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );
    } else {
      //Si se selecciona opcion por defecto se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
      this.servicioServs = null;
      this.malRequestS = true;
      this.malRequestSPag = true;

      this.servicioServsMaxMin = null;
      this.malRequestMaxMin = true;
      this.malRequestMaxMinPag = true;
    }
  }

  buscarEvalEmpl() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateDesdeEvalEmpl.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalEmpl.nativeElement.value
      .toString()
      .trim();
    var cod = this.codCajeroEvalEmpl.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalEvalEmpl.nativeElement.value.toString().trim();

    if (cod != "-1") {
      this.serviceService
        .getprmediosempleado(fechaDesde, fechaHasta, parseInt(cod))
        .subscribe(
          (servicioEvalEmpl: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioEvalEmpl = servicioEvalEmpl.turnos;
            this.malRequestE = false;
            this.malRequestEPag = false;
            //Seteo de paginacion cuando se hace una nueva busqueda
            if (this.configE.currentPage > 1) {
              this.configE.currentPage = 1;
            }
            this.todasSucursalesE = this.comprobarBusquedaSucursales(codSucursal);
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
              this.servicioEvalEmpl = null;
              this.malRequestE = true;
              this.malRequestEPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioEvalEmpl == null) {
                this.configE.totalItems = 0;
              } else {
                this.configE.totalItems = this.servicioEvalEmpl.length;
              }
              //Por error 400 se setea elementos de paginacion
              this.configE = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );

      this.serviceService
        .getmaxminempleado(fechaDesde, fechaHasta, parseInt(cod))
        .subscribe(
          (servicioEvalMMEmpl: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioEvalMMEmpl = servicioEvalMMEmpl.turnos;
            this.malRequestE = false;
            //Seteo de paginacion cuando se hace una nueva busqueda
            if (this.configEMM.currentPage > 1) {
              this.configEMM.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
              this.servicioEvalEmpl = null;
              this.servicioEvalMMEmpl = null;
              this.malRequestE = true;
              this.malRequestEPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioEvalMMEmpl == null) {
                this.configEMM.totalItems = 0;
              } else {
                this.configEMM.totalItems = this.servicioEvalMMEmpl.length;
              }
              //Por error 400 se setea elementos de paginacion
              this.configEMM = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );
    } else {
      //Si elige opcion por defecto se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
      this.servicioEvalEmpl = null;
      this.servicioEvalMMEmpl = null;

      this.malRequestE = true;
      this.malRequestEPag = true;
    }
  }
  buscarEvalOmitidas() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateDesdeEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    var cod = this.codCajeroEvalOmitidas.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalEvalOmitidas.nativeElement.value.toString().trim();

    if (cod != "-1") {
      this.serviceService
        .getevalomitidasempleado(fechaDesde, fechaHasta, parseInt(cod))
        .subscribe(
          (servicioEvalOmitidas: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioEvalOmitidas = servicioEvalOmitidas.turnos;
            this.malRequestEOmitidas = false;
            this.malRequestEOmitidasPag = false;
            //Seteo de paginacion cuando se hace una nueva busqueda
            if (this.configEOmitidas.currentPage > 1) {
              this.configEOmitidas.currentPage = 1;
            }
            this.todasSucursalesEO = this.comprobarBusquedaSucursales(codSucursal)
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
              this.servicioEvalOmitidas = null;
              this.malRequestEOmitidas = true;
              this.malRequestEOmitidasPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioEvalOmitidas == null) {
                this.configEOmitidas.totalItems = 0;
              } else {
                this.configEOmitidas.totalItems =
                  this.servicioEvalOmitidas.length;
              }
              //Por error 400 se setea elementos de paginacion
              this.configEOmitidas = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );
    } else {
      //Si elige opcion por defecto se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
      this.servicioEvalOmitidas = null;

      this.malRequestEOmitidas = true;
      this.malRequestEOmitidasPag = true;
    }
  }

  buscarEvalGr() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateDesdeEvalGr.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGr.nativeElement.value
      .toString()
      .trim();
    var serv = this.codCajeroEvalGr.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalEvalGr.nativeElement.value.toString().trim();

    if (serv != "-1") {
      this.serviceService
        .getevalgrupo(fechaDesde, fechaHasta, parseInt(serv))
        .subscribe(
          (servicioG: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioG = servicioG.turnos;
            this.malRequestG = false;
            this.malRequestGPag = false;
            //Seteo de paginacion cuando se hace una nueva busqueda
            if (this.configEG.currentPage > 1) {
              this.configEG.currentPage = 1;
            }
            this.todasSucursalesEG = this.comprobarBusquedaSucursales(codSucursal);
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
              this.servicioG = null;
              this.malRequestG = true;
              this.malRequestGPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioG == null) {
                this.configEG.totalItems = 0;
              } else {
                this.configEG.totalItems = this.servicioG.length;
              }
              //Por error 400 se setea elementos de paginacion
              this.configEG = {
                itemsPerPage: this.MAX_PAGS,
                currentPage: 1,
              };
            }
          }
        );
    } else {
      //Si se selecciona opcion por defecto se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
      this.servicioG = null;
      this.malRequestG = true;
      this.malRequestGPag = true;
    }
  }

  leerEstablecimientos() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateEstb.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateEstb.nativeElement.value.toString().trim();

    var cod = this.codSucursalEst.nativeElement.value.toString().trim();

    this.serviceService.getestablecimiento(fechaDesde, fechaHasta, cod).subscribe(
      (servicio: any) => {
        //Si se consulta correctamente se guarda en variable y setea banderas de tablas
        this.servicioEstb = servicio.turnos;
        this.malRequestEstb = false;
        this.malRequestEstbPag = false;
        //Seteo de paginacion cuando se hace una nueva busqueda
        if (this.configEstb.currentPage > 1) {
          this.configEstb.currentPage = 1;
        }
        this.todasSucursalesEST = this.comprobarBusquedaSucursales(cod);
      },
      (error) => {
        if (error.status == 400) {
          //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
          this.servicioEstb = null;
          this.malRequestEstb = true;
          this.malRequestEstbPag = true;
          //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
          //caso contrario se setea la cantidad de elementos
          if (this.servicioEstb == null) {
            this.configEstb.totalItems = 0;
          } else {
            this.configEstb.totalItems = this.servicioEstb.length;
          }
          //Por error 400 se setea elementos de paginacion
          this.configEstb = {
            itemsPerPage: this.MAX_PAGS,
            currentPage: 1,
          };
        }
      }
    );
  }

  leerGraficosevabar() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateDesdeEvalGra.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGra.nativeElement.value
      .toString()
      .trim();
    var cod = this.codCajeroEvalGra.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursal.nativeElement.value.toString().trim();

    this.serviceService
      .getgraficobarrasfiltro(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (servicioGra: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioGra = servicioGra.turnos;
          this.malRequestGra = false;
          this.malRequestGraPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configG.currentPage > 1) {
            this.configG.currentPage = 1;
          }
          this.todasSucursalesG = this.comprobarBusquedaSucursales(codSucursal);
          //Formateo y mapeo de datos para imprimir valores en grafico
          let evOrig = this.servicioGra;
          let total = servicioGra.turnos.map((res) => res.total);
          let evaluaciones = servicioGra.turnos.map((res) => res.usuario);
          let evaluacionesNombre = servicioGra.turnos.map(
            (res) => res.evaluacion
          );

          let Nombres = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Malo"];
          let valNombres = [0, 0, 0, 0, 0];
          let totalPorc = 0;
          let porcts = [0, 0, 0, 0, 0];
          //Empate para obtener porcentajes de Nombres que no posea la consulta (Si una consulta no tiene Malos, aqui se completa para mostrar mejor los datos al usuario)
          for (var i = 0; i < Nombres.length; i++) {
            if (evOrig.find((val) => val.evaluacion === Nombres[i]) != null) {
              valNombres[i] = evOrig.find(
                (val) => val.evaluacion === Nombres[i]
              ).total;
            }
            totalPorc = totalPorc + valNombres[i];
          }
          for (var i = 0; i < Nombres.length; i++) {
            porcts[i] =
              Math.round(((valNombres[i] * 100) / totalPorc) * 1000) / 1000;
            Nombres[i] = Nombres[i] + "\n" + porcts[i] + "%";
          }
          //Seteo de titulo de grafico
          var titulo = true;
          if (this.tipo == "bar") {
            titulo = false;
          } else {
            titulo = true;
          }

          //Creacion de chart [imagen] de tipo canvas si es bar
          if (this.tipo == "bar") {
            //Se define parametros como los labels, data, opciones (mostrar el titulo o responsive)
            this.chart = new Chart("canvas", {
              type: this.tipo,
              data: {
                labels: Nombres, //eje x
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
            //Creacion de chart [imagen] de tipo canvas de tipo pie
            //Se define parametros como los labels, data, opciones (mostrar el titulo o responsive)
            this.chart = new Chart("canvas", {
              //type: this.tipo,
              type: 'pie',
              data: {
                labels: Nombres, //eje x
                datasets: [
                  {
                    label: evaluaciones[0],
                    data: valNombres, //eje y
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
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioGra = null;
            this.malRequestGra = true;
            this.malRequestGraPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioGra == null) {
              this.configG.totalItems = 0;
            } else {
              this.configG.totalItems = this.servicioGra.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configG = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1,
            };
          }
        }
      );
    //Si chart es vacio no pase nada, caso contrario si tienen ya datos, se destruya para crear uno nuevo, evitando superposision del nuevo chart
    if (this.chart != undefined || this.chart != null) {
      this.chart.destroy();
    }
  }

  //Funcion que detecta cambio de tipo de grafico, y crea uno nuevo
  cambiar(tipo: string) {
    this.tipo = tipo;
    if (this.chart) {
      this.chart.destroy();
    }
    this.leerGraficosevabar();
  }

  obtenerNombreSucursal(cod: string) {
    if (cod == "-1") {
      return "Todas las sucursales"
    } else {
      let nombreSucursal = (this.sucursales.find(sucursal => sucursal.empr_codigo == cod)).empr_nombre;
      return nombreSucursal;
    }
  }

  exportarAExcelServicios() {
    let cod = this.codSucursalServicio.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Servicios
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesS) {
      for (let i = 0; i < this.servicioServs.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioServs[i].nombreEmpresa,
          Usuario: this.servicioServs[i].Usuario,
          Fecha: this.servicioServs[i].Fecha,
          Excelente: this.servicioServs[i].Excelente,
          "Muy Bueno": this.servicioServs[i].Muy_Bueno,
          Bueno: this.servicioServs[i].Bueno,
          Regular: this.servicioServs[i].Regular,
          Malo: this.servicioServs[i].Malo,
          Total: this.servicioServs[i].Total,
          Promedio: this.servicioServs[i].Promedio,
        });
      }
    } else {
      for (let i = 0; i < this.servicioServs.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioServs[i].Usuario,
          Fecha: this.servicioServs[i].Fecha,
          Excelente: this.servicioServs[i].Excelente,
          "Muy Bueno": this.servicioServs[i].Muy_Bueno,
          Bueno: this.servicioServs[i].Bueno,
          Regular: this.servicioServs[i].Regular,
          Malo: this.servicioServs[i].Malo,
          Total: this.servicioServs[i].Total,
          Promedio: this.servicioServs[i].Promedio,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioServs[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");

    //Max Min
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicioAux = [];
    if (this.todasSucursalesS) {
      for (let i = 0; i < this.servicioServsMaxMin.length; i++) {
        jsonServicioAux.push({
          Sucursal: this.servicioServsMaxMin[i].empresaNombre,
          Usuario: this.servicioServsMaxMin[i].Usuario,
          Fecha: this.servicioServsMaxMin[i].Fecha,
          Excelente: this.servicioServsMaxMin[i].Excelente,
          "Muy Bueno": this.servicioServsMaxMin[i].Muy_Bueno,
          Bueno: this.servicioServsMaxMin[i].Bueno,
          Regular: this.servicioServsMaxMin[i].Regular,
          Malo: this.servicioServsMaxMin[i].Malo,
          Total: this.servicioServsMaxMin[i].Total,
          Máx: this.servicioServsMaxMin[i].max,
          Mín: this.servicioServsMaxMin[i].min,
        });
      }
    } else {
      for (let i = 0; i < this.servicioServsMaxMin.length; i++) {
        jsonServicioAux.push({
          Usuario: this.servicioServsMaxMin[i].Usuario,
          Fecha: this.servicioServsMaxMin[i].Fecha,
          Excelente: this.servicioServsMaxMin[i].Excelente,
          "Muy Bueno": this.servicioServsMaxMin[i].Muy_Bueno,
          Bueno: this.servicioServsMaxMin[i].Bueno,
          Regular: this.servicioServsMaxMin[i].Regular,
          Malo: this.servicioServsMaxMin[i].Malo,
          Total: this.servicioServsMaxMin[i].Total,
          Máx: this.servicioServsMaxMin[i].max,
          Mín: this.servicioServsMaxMin[i].min,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicioAux);
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header1 = Object.keys(this.servicioServsMaxMin[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols1 = [];
    for (var i = 0; i < header1.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols1.push({ wpx: 150 })
    }
    ws1["!cols"] = wscols1;
    XLSX.utils.book_append_sheet(wb, ws1, "Máximos y Mínimos");
    XLSX.writeFile(
      wb,
      "Servicios - " + nombreSucursal + " - " + new Date().toLocaleString() + EXCEL_EXTENSION
    );
  }

  exportarAExcelEvalEmpl() {
    let cod = this.codSucursalEvalEmpl.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesE) {
      for (let i = 0; i < this.servicioEvalEmpl.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioEvalEmpl[i].nombreEmpresa,
          Usuario: this.servicioEvalEmpl[i].usua_nombre,
          Fecha: this.servicioEvalEmpl[i].fecha,
          Excelente: this.servicioEvalEmpl[i].Excelente,
          "Muy Bueno": this.servicioEvalEmpl[i].Muy_Bueno,
          Bueno: this.servicioEvalEmpl[i].Bueno,
          Regular: this.servicioEvalEmpl[i].Regular,
          Malo: this.servicioEvalEmpl[i].Malo,
          Total: this.servicioEvalEmpl[i].Total,
          Promedio: this.servicioEvalEmpl[i].Promedio,
        });
      }
    } else {
      for (let i = 0; i < this.servicioEvalEmpl.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioEvalEmpl[i].usua_nombre,
          Fecha: this.servicioEvalEmpl[i].fecha,
          Excelente: this.servicioEvalEmpl[i].Excelente,
          "Muy Bueno": this.servicioEvalEmpl[i].Muy_Bueno,
          Bueno: this.servicioEvalEmpl[i].Bueno,
          Regular: this.servicioEvalEmpl[i].Regular,
          Malo: this.servicioEvalEmpl[i].Malo,
          Total: this.servicioEvalEmpl[i].Total,
          Promedio: this.servicioEvalEmpl[i].Promedio,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre de la hoja
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEvalEmpl[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Empleado");

    //Max Min
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicioAux = [];
    if (this.todasSucursalesE) {
      for (let i = 0; i < this.servicioEvalMMEmpl.length; i++) {
        jsonServicioAux.push({
          Sucursal: this.servicioEvalMMEmpl[i].nombreEmpresa,
          Usuario: this.servicioEvalMMEmpl[i].usua_nombre,
          Fecha: this.servicioEvalMMEmpl[i].fecha,
          Excelente: this.servicioEvalMMEmpl[i].Excelente,
          "Muy Bueno": this.servicioEvalMMEmpl[i].Muy_Bueno,
          Bueno: this.servicioEvalMMEmpl[i].Bueno,
          Regular: this.servicioEvalMMEmpl[i].Regular,
          Malo: this.servicioEvalMMEmpl[i].Malo,
          Total: this.servicioEvalMMEmpl[i].Total,
          Máx: this.servicioEvalMMEmpl[i].max,
          Mín: this.servicioEvalMMEmpl[i].min,
        });
      }
    } else {
      for (let i = 0; i < this.servicioEvalMMEmpl.length; i++) {
        jsonServicioAux.push({
          Usuario: this.servicioEvalMMEmpl[i].usua_nombre,
          Fecha: this.servicioEvalMMEmpl[i].fecha,
          Excelente: this.servicioEvalMMEmpl[i].Excelente,
          "Muy Bueno": this.servicioEvalMMEmpl[i].Muy_Bueno,
          Bueno: this.servicioEvalMMEmpl[i].Bueno,
          Regular: this.servicioEvalMMEmpl[i].Regular,
          Malo: this.servicioEvalMMEmpl[i].Malo,
          Total: this.servicioEvalMMEmpl[i].Total,
          Máx: this.servicioEvalMMEmpl[i].max,
          Mín: this.servicioEvalMMEmpl[i].min,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicioAux);
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header1 = Object.keys(this.servicioEvalMMEmpl[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols1 = [];
    for (var i = 0; i < header1.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols1.push({ wpx: 150 })
    }
    ws1["!cols"] = wscols1;
    XLSX.utils.book_append_sheet(wb, ws1, "Máximos y Mínimos Empleado");
    XLSX.writeFile(
      wb,
      "servicio-eval-empl - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEvalOmitidas() {
    let cod = this.codSucursalEvalOmitidas.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesEO) {
      for (let i = 0; i < this.servicioEvalOmitidas.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioEvalOmitidas[i].nombreEmpresa,
          Usuario: this.servicioEvalOmitidas[i].usua_nombre,
          Fecha: this.servicioEvalOmitidas[i].fecha,
          Total: this.servicioEvalOmitidas[i].Total,
        });
      }
    } else {
      for (let i = 0; i < this.servicioEvalOmitidas.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioEvalOmitidas[i].usua_nombre,
          Fecha: this.servicioEvalOmitidas[i].fecha,
          Total: this.servicioEvalOmitidas[i].Total,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre de la hoja
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEvalOmitidas[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "EvaluacionesOmitidas");

    XLSX.writeFile(
      wb,
      "servicio-eval-omitidas - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEstb() {
    let cod = this.codSucursalEst.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesEST) {
      for (let i = 0; i < this.servicioEstb.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioEstb[i].nombreEmpresa,
          Fecha: this.servicioEstb[i].fecha,
          Excelente: this.servicioEstb[i].Excelente,
          "Muy Bueno": this.servicioEstb[i].Muy_Bueno,
          Bueno: this.servicioEstb[i].Bueno,
          Regular: this.servicioEstb[i].Regular,
          Malo: this.servicioEstb[i].Malo,
          Total: this.servicioEstb[i].Total,
        });
      }
    } else {
      for (let i = 0; i < this.servicioEstb.length; i++) {
        jsonServicio.push({
          Fecha: this.servicioEstb[i].fecha,
          Excelente: this.servicioEstb[i].Excelente,
          "Muy Bueno": this.servicioEstb[i].Muy_Bueno,
          Bueno: this.servicioEstb[i].Bueno,
          Regular: this.servicioEstb[i].Regular,
          Malo: this.servicioEstb[i].Malo,
          Total: this.servicioEstb[i].Total,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEstb[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Establecimiento");
    XLSX.writeFile(
      wb,
      "Establecimiento - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportarAExcelEvalGr() {
    let cod = this.codSucursalEvalGr.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesEG) {
      for (let i = 0; i < this.servicioG.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioG[i].nombreEmpresa,
          Usuario: this.servicioG[i].usua_nombre,
          Fecha: this.servicioG[i].fecha,
          Bueno: this.servicioG[i].Bueno,
          Malo: this.servicioG[i].Malo,
          Total: this.servicioG[i].Total,
          Promedio: this.servicioG[i].Promedio,
        });
      }
    } else {
      for (let i = 0; i < this.servicioG.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioG[i].usua_nombre,
          Fecha: this.servicioG[i].fecha,
          Bueno: this.servicioG[i].Bueno,
          Malo: this.servicioG[i].Malo,
          Total: this.servicioG[i].Total,
          Promedio: this.servicioG[i].Promedio,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioG[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Grupos");
    XLSX.writeFile(
      wb,
      "Evalgrupo - " + nombreSucursal + " - " + new Date().toLocaleString() + EXCEL_EXTENSION
    );
  }

  exportarAExcelGra() {
    //Generacion de archivo excel, al generar PDF
    this.genGraficoPDF();
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesG) {
      for (let i = 0; i < this.servicioGra.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioGra[i].nombreEmpresa,
          Usuario: this.servicioGra[i].usuario,
          Evaluación: this.servicioGra[i].evaluacion,
          Total: this.servicioGra[i].total,
          Porcentajes: this.servicioGra[i].porcentaje,
        });
      }
    } else {
      for (let i = 0; i < this.servicioGra.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioGra[i].usuario,
          Evaluación: this.servicioGra[i].evaluacion,
          Total: this.servicioGra[i].total,
          Porcentajes: this.servicioGra[i].porcentaje,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioGra[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(
      wb,
      "graficoservicio" +
      "_export_" +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  /////---Generacion de PDF's
  generarPdfServicios(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateServicios.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateServicios.nativeElement.value.toString().trim();
    var cod = this.codSucursalServicio.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentServicios(fechaDesde, fechaHasta, cod);
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
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

  //Funcion delegada para seteo de información en estructura
  getDocumentServicios(fechaDesde, fechaHasta, cod) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: {
        text: "FullTime Tickets",
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
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
      //Contenido del PDF, logo, nombre del reporte, con el renago de fechas de los datos
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 75,
              height: 40,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Evaluación Servicio y Máximos y Mínimos",
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
        //Definicion de funcion delegada para setear informacion de tabla del PDF Servicio y Max Min
        this.servicios(this.servicioServs),
        this.maxmin(this.servicioServsMaxMin),
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

  //Funcion para llenar la tabla con la consulta realizada al backend Servicios
  servicios(servicio: any[]) {
    if (this.todasSucursalesS) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  //Funcion para llenar la tabla con la consulta realizada al backend Max Mins
  maxmin(servicio: any[]) {
    if (this.todasSucursalesS) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfEvalEmpl(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateDesdeEvalEmpl.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalEmpl.nativeElement.value
      .toString()
      .trim();
    var cod = this.codSucursalEvalEmpl.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEmpleado(fechaDesde, fechaHasta, cod);
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
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

  //Funcion delegada para seteo de información de estructura
  getDocumentEmpleado(fechaDesde, fechaHasta, cod) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: {
        text: "FullTime Tickets",
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
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
      //Contenido del PDF, logo, nombre del reporte, con el renago de fechas de los datos
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 40,
            },
            {
              width: "*",
              alignment: "center",
              text:
                "Reporte" + "\n" + " Evaluación Empleado y Máximos y Mínimos",
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
        //Definicion de funcion delegada para setear informacion de tabla del PDF Empleado y Max, Min
        this.empleado(this.servicioEvalEmpl),
        this.maxmine(this.servicioEvalMMEmpl),
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

  //Funcion para llenar la tabla con la consulta realizada al backend
  empleado(servicio: any[]) {
    if (this.todasSucursalesE) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  //Funcion para llenar la tabla con la consulta realizada al backend
  maxmine(servicio: any[]) {
    if (this.todasSucursalesE) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfEvalOmitidas(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateDesdeEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalOmitidas.nativeElement.value
      .toString()
      .trim();
    var cod = this.codSucursalEvalOmitidas.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEvaluacionesOmitidas(
        fechaDesde,
        fechaHasta,
        cod
      );
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
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

  //Funcion delegada para seteo de información de estructura
  getDocumentEvaluacionesOmitidas(fechaDesde, fechaHasta, cod) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: {
        text: "FullTime Tickets",
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
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
      //Contenido del PDF, logo, nombre del reporte, con el renago de fechas de los datos
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 40,
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
        //Definicion de funcion delegada para setear informacion de tabla del PDF Evaluaciones omitidas
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

  //Funcion para llenar la tabla con la consulta realizada al backend
  omitidas(servicio: any[]) {
    if (this.todasSucursalesEO) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
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
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfEstb(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateEstb.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateEstb.nativeElement.value.toString().trim();
    var cod = this.codSucursalEst.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEstablecimiento(
        fechaDesde,
        fechaHasta,
        cod
      );
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
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

  //Funcion delegada para seteo de información
  getDocumentEstablecimiento(fD, fH, cod) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: {
        text: "FullTime Tickets",
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
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
      //Contenido del PDF, logo, nombre del reporte, con el renago de fechas de los datos
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 40,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Evaluación Establecimiento",
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
        this.establecimientos(this.servicioEstb), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF en estructura
  establecimientos(servicio: any[]) {
    if (this.todasSucursalesEST) {
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfEvalGr(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateDesdeEvalGr.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGr.nativeElement.value
      .toString()
      .trim();
    var cod = this.codSucursalEvalGr.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEvaGrupo(fechaDesde, fechaHasta, cod);
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
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

  //Funcion delegada para seteo de información
  getDocumentEvaGrupo(fechaDesde, fechaHasta, cod) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: {
        text: "FullTime Tickets",
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
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
      //Contenido del PDF, logo, nombre del reporte, con el renago de fechas de los datos
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 40,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Evaluación por Grupo",
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
        this.evagrupo(this.servicioG), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Funcion para llenar la tabla con la consulta realizada al backend
  evagrupo(servicio: any[]) {
    if (this.todasSucursalesEG) {
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  //PDF DE GRAFICOS
  generarPdfGra(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateDesdeEvalGra.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateHastaEvalGra.nativeElement.value
      .toString()
      .trim();
    var cod = this.codSucursal.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentGr(fechaDesde, fechaHasta, cod);
      // this.genGraficoPDF();
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
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

  //Funcion delegada para seteo de información
  getDocumentGr(fechaDesde, fechaHasta, cod) {
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    //De imagen HTML, a mapa64 bits formato con el que trabaja PDFMake
    var canvasImg = canvas1.toDataURL("image/png");
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    //Formateo de datos para obtener, los valores de cada parámetro
    let Nombres = ["Excelente", "Muy Bueno", "Bueno", "Regular", "Malo"];
    let valNombres = [0, 0, 0, 0, 0];
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
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: {
        text: "FullTime Tickets",
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
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
      //Contenido del PDF, logo, nombre del reporte, con el renago de fechas de los datos
      content: [
        {
          columns: [
            {
              image: this.urlImagen,
              width: 90,
              height: 40,
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
        this.graficoImagen(canvasImg), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  grafico(servicio: any[]) {
    if (this.todasSucursalesG) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Usuario", style: "tableHeader" },
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
                { style: "itemsTable", text: res.porcentaje },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex) {
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
              { text: "Usuario", style: "tableHeader" },
              { text: "Evaluacion", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
              { text: "Porcentajes", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.usuario },
                { style: "itemsTable", text: res.evaluacion },
                { style: "itemsTable", text: res.total },
                { style: "itemsTable", text: res.porcentaje },
              ];
            }),
          ],
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  genGraficoPDF() {
    //Selecciona de la interfaz el elemento que contiene la grafica
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    //De imagen HTML, a mapa64 bits formato con el que trabaja PDFMake
    var canvasImg = canvas1.toDataURL("image/png");
    //crea PDF
    var doc = new jsPDF("l", "mm", "a4");
    //Se obtiene el largo y ancho de la pagina este caso a4
    let pageWidth = doc.internal.pageSize.getWidth();
    let pageHeight = doc.internal.pageSize.getHeight();
    //Obtiene fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    var fecha = f.toJSON().split("T")[0];
    var timer = f.toJSON().split("T")[1].slice(0, 5);
    //Obtiene el centro superior de la pagina
    let textEnc = "Reporte - Gráfico Evaluaciones";
    let textEncWidth =
      (doc.getStringUnitWidth(textEnc) * doc.getFontSize()) /
      doc.internal.scaleFactor;
    let xTextEnc = (pageWidth - textEncWidth) / 2;
    //Imprime fecha, encabezado, pie de pagina respectivamente
    doc.text("Fecha: " + fecha + " Hora: " + timer, 5, pageHeight - 10);
    doc.text(textEnc, xTextEnc, 10);
    doc.text("Impreso por: " + this.userDisplayName, 200, pageHeight - 10);
    //añade imagen en el centro del documento
    doc.addImage(canvasImg, "PNG", 10, 10, 280, 150);
    //guarda PDF con un nombre propuesto
    doc.save(`Gráfico-Evaluaciones ${fecha}, ${timer}.pdf`);
    window.open(URL.createObjectURL(doc.output("blob")));
  }
}
