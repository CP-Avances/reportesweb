import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { Chart } from "chart.js";

import { ServiceService } from "../../services/service.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from "../../services/authentication.service";

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { Utils } from "../../utils/util";
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
import * as XLSX from "xlsx";
const EXCEL_EXTENSION = ".xlsx";

@Component({
  selector: "app-opinion",
  templateUrl: "./opinion.component.html",
  styleUrls: ["./opinion.component.scss"],
})

export class OpinionComponent implements OnInit {
  chart: any = '';

  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("fromDateAtM") fromDateAtM: ElementRef;
  @ViewChild("toDateAtM") toDateAtM: ElementRef;
  @ViewChild("fromDateIC") fromDateIC: ElementRef;
  @ViewChild("toDateIC") toDateIC: ElementRef;
  @ViewChild("fromDateOcupG") fromDateOcupG: ElementRef;
  @ViewChild("toDateOcupG") toDateOcupG: ElementRef;
  @ViewChild("fromDateOcupGIC") fromDateOcupGIC: ElementRef;
  @ViewChild("toDateOcupGIC") toDateOcupGIC: ElementRef;
  @ViewChild('codSucursalAtM') codSucursalAtM: ElementRef;
  @ViewChild('codSucursalOcupG') codSucursalOcupG: ElementRef;

  @ViewChild("horaInicioI") horaInicioI: ElementRef;
  @ViewChild("horaFinI") horaFinI: ElementRef;
  @ViewChild("horaInicioIC") horaInicioIC: ElementRef;
  @ViewChild("horaFinIC") horaFinIC: ElementRef;
  @ViewChild("horaInicioG") horaInicioG: ElementRef;
  @ViewChild("horaFinG") horaFinG: ElementRef;
  @ViewChild("horaInicioGIC") horaInicioGIC: ElementRef;
  @ViewChild("horaFinGIC") horaFinGIC: ElementRef;


  // VARIABLES DE LA GRAFICA
  chartPie: any;
  chartBar: any;
  tipo: string;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioOpinionIC: any = [];
  servicioOpinion: any = [];
  servicioocg: any = [];
  servicioocgIC: any = [];
  categorias: any[];
  sucursales: any[];
  servicio: any;

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesI: boolean = false;
  todasSucursalesIC: boolean = false;
  todasSucursalesG: boolean = false;
  todasSucursalesGIC: boolean = false;
  todasCategorias: boolean = false;
  todosTipos: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestAtM: boolean = false;
  malRequestAtMIC: boolean = false;
  malRequestAtMPag: boolean = false;
  malRequestAtMICPag: boolean = false;
  malRequestIC: boolean = false;
  malRequestICPag: boolean = false;
  malRequestOcupG: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configAtM: any;
  configAtMIC: any;
  configIC: any;
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };

  // CONTROL DE LABELS POR ANCHO DE PANTALLA
  legend: any;

  // OBTIENE FECHA ACTUAL para colocarlo en cuadro de fecha
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year + "-" + this.month + "-" + this.day;

  // IMAGEN LOGO
  urlImagen: string;

  // OPCIONES MULTIPLES
  sucursalesSeleccionadas: string[] = [];
  tiposSeleccionados: string[] = [];
  categoriasSeleccionadas: string[] = [];
  seleccionMultiple: boolean = false;
  tipos = [
    { nombre: 'Quejas', valor: '1' },
    { nombre: 'Reclamos', valor: '2' },
    { nombre: 'Sugerencias', valor: '3' },
    { nombre: 'Felicitaciones', valor: '4' },
  ]

  // ORIENTACION
  orientacion: string;

  // INFORMACION
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  mostrarCategorias: boolean = false;

  constructor(
    private imagenesService: ImagenesService,
    private serviceService: ServiceService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configAtM = {
      id: "AtendidosMatm",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioOpinion.length,
    };
    this.configAtMIC = {
      id: "AtendidosMatmIC",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioocgIC.length,
    };
    this.configIC = {
      id: "opinionesIC",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioOpinionIC.length,
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }

  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedAtM(event: any) {
    this.configAtM.currentPage = event;
  }

  pageChangedIC(event: any) {
    this.configIC.currentPage = event;
  }

  ngOnInit(): void {
    // CARGAMOS TIPO DE GRAFICO
    this.tipo = "pie";
    // SETEO ORIENTACION
    this.orientacion = "portrait";
    // CARGAMOS COMPONENTES SELECTS HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestAtMPag = true;
    this.malRequestICPag = true;

    // ACTUALIZAR CABECERA
    this.serviceService.actualizarCabecera();

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
      case 'todasSucursalesI':
        this.todasSucursalesI = !this.todasSucursalesI;
        break;
      case 'todasSucursalesIC':
        this.todasSucursalesIC = !this.todasSucursalesIC;
        break;
      case 'todasSucursalesG':
        this.todasSucursalesG = !this.todasSucursalesG;
        break;
      case 'todasSucursalesGIC':
        this.todasSucursalesGIC = !this.todasSucursalesGIC;
        break;
      case 'todasCategorias':
        this.todasCategorias = !this.todasCategorias;
        break;
      case 'todosTipos':
        this.todosTipos = !this.todosTipos;
        break;
      case 'tipo1':
        this.getCategorias(1);
        break;
      case 'tipo2':
        this.getCategorias(2);
        break;
      case 'sucursalesSeleccionadas':
        this.sucursalesSeleccionadas.length > 1
          ? this.seleccionMultiple = true
          : this.seleccionMultiple = false;
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

  // SE OBTIENE DIA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  getCategorias(tipo: any) {
    this.serviceService.getAllCategorias(tipo).subscribe((categoria: any) => {
      this.categorias = categoria.categoria;
      this.mostrarCategorias = true;
    });
  }

  limpiar() {
    this.getSucursales();
    this.todasSucursalesI = false;
    this.todasSucursalesG = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/").then(() => {
      window.location.reload();
    });
}

  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  leerOpiniones() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateAtM.nativeElement.value.toString().trim();
    var fH = this.toDateAtM.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioI.nativeElement.value;
    let horaFin = this.horaFinI.nativeElement.value;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getopiniones(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioOpinion = servicio.turnos;
          this.servicioOpinion.forEach(dato => {
            if (dato.caja_caja_nombre === '0') {
              dato.caja_caja_nombre = ' ';
            }
          })
          this.malRequestAtM = false;
          this.malRequestAtMPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configAtM.currentPage > 1) {
            this.configAtM.currentPage = 1;
          }
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioOpinion = null;
            this.malRequestAtM = true;
            this.malRequestAtMPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/
            if (this.servicioOpinion == null) {
              this.configAtM.totalItems = 0;
            } else {
              this.configAtM.totalItems = this.servicioOpinion.length;
            }

            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configAtM = {
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

  leerOpinionesC() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateIC.nativeElement.value.toString().trim();
    var fH = this.toDateIC.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioIC.nativeElement.value;
    let horaFin = this.horaFinIC.nativeElement.value;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados, this.categoriasSeleccionadas).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioOpinionIC = servicio.turnos;
          this.servicioOpinionIC.forEach(dato => {
            if (dato.caja_caja_nombre === '0') {
              dato.caja_caja_nombre = ' ';
            }
          })
          this.malRequestIC = false;
          this.malRequestICPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configIC.currentPage > 1) {
            this.configIC.currentPage = 1;
          }
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioOpinionIC = null;
            this.malRequestIC = true;
            this.malRequestICPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/
            if (this.servicioOpinionIC == null) {
              this.configIC.totalItems = 0;
            } else {
              this.configIC.totalItems = this.servicioOpinionIC.length;
            }

            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configIC = {
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

  leerGrafOpinion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateOcupG.nativeElement.value.toString().trim();
    var fH = this.toDateOcupG.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioG.nativeElement.value;
    let horaFin = this.horaFinG.nativeElement.value;

    this.malRequestAtM = false;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getgraficoopinion(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicioocg: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioocg = servicioocg.turnos;
          // this.malRequestAtM = false;
          this.malRequestAtMPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configAtM.currentPage > 1) {
            this.configAtM.currentPage = 1;
          }
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioocg = null;
            this.malRequestAtM = true;
            this.malRequestAtMPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/
            if (this.servicioocg == null) {
              this.configAtM.totalItems = 0;
            } else {
              this.configAtM.totalItems = this.servicioocg.length;
            }

            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configAtM = {
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

      this.serviceService.getgraficoopinion(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          // SE VERIFICA EL ANCHO DE PANTALLA PARA COLOCAR O NO LABELS
          this.legend = screen.width < 575 ? false : true;
          // MAPEO DE PORCENTAJES PARA MOSTRAR EN PANTALLA
          this.servicio = servicio.turnos;
          let total = servicio.turnos.map((res) => res.queja_cantidad);
          let tipo = servicio.turnos.map((res) => res.quejas_emi_tipo);
          let Nombres: any = [];
          let totalPorc = 0;
          for (var i = 0; i < tipo.length; i++) {
            totalPorc = totalPorc + total[i];
          }
          for (var i = 0; i < tipo.length; i++) {
            Nombres.push(
              tipo[i] +
              "\n" +
              Math.round(((total[i] * 100) / totalPorc) * 1000) / 1000 +
              "%"
            );
          }

          // SE CREA EL GRAFICO
          this.chartPie = new Chart("canvas", {
            // EL TIPO DE GRAFICO
            type: (this.tipo = "pie"),
            data: {
              labels: Nombres, // EJE X
              datasets: [
                {
                  label: "Total",
                  data: total, // EJE Y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",

                    "rgba(104, 210, 34, 0.6)",
                  ],
                },
              ],
            },
            // SE SETEA TITULO ASI COMO VALORES EN GRAFICO
            options: {

              plugins: {
                title: {
                  display: true,
                },
                datalabels: {
                  color: "black",
                  labels: {
                    title: {
                      color: "blue",
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
          // SE CREA SEGUNDO GRAFICO
          this.chartBar = new Chart("canvas2", {
            // TIPO DE GRÁFICO BAR
            type: (this.tipo = "bar"),
            data: {
              labels: Nombres, // EJE X
              datasets: [
                {
                  label: "Total",
                  data: total, // EJE Y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",

                    "rgba(104, 210, 34, 0.6)",
                  ],
                },
              ],
            },
            options: {
              scales: {
                /* xAxes: [
                   {
                     ticks: {
                       display: this.legend,
                     },
                   },
                 ],*/
              },
              plugins: {
                title: {
                  display: true,
                },
                legend: {
                  display: false,
                },
              },

              responsive: true,
            },
          });
        },
        (error) => {
          if (error.status == 400) {
            // POR ERROR 400 SE VACIA VARIABLE DE CONSULTA
            this.servicio = null;
          }
        }
      );
    }
    /** SI CHART ES VACIO NO PASE NADA, CASO CONTRARIO SI TIENEN YA DATOS, SE DESTRUYA PARA CREAR UNO NUEVO,
     *  EVITANDO SUPERPOSISION DEL NUEVO CHART
     **/
    if (this.chartPie != undefined || this.chartPie != null) {
      this.chartPie.destroy();
    }
    if (this.chartBar != undefined || this.chartBar != null) {
      this.chartBar.destroy();
    }
  }

  leerGrafOpinionIC() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateOcupGIC.nativeElement.value.toString().trim();
    var fH = this.toDateOcupGIC.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioGIC.nativeElement.value;
    let horaFin = this.horaFinGIC.nativeElement.value;

    this.malRequestAtMIC = false;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getgraficoopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicioocgIC: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioocgIC = servicioocgIC.turnos;
          this.malRequestAtMICPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configAtMIC.currentPage > 1) {
            this.configAtMIC.currentPage = 1;
          }
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioocgIC = null;
            this.malRequestAtMIC = true;
            this.malRequestAtMICPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/
            if (this.servicioocgIC == null) {
              this.configAtMIC.totalItems = 0;
            } else {
              this.configAtMIC.totalItems = this.servicioocgIC.length;
            }

            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configAtMIC = {
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

      this.serviceService.getgraficoopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          // SE VERIFICA EL ANCHO DE PANTALLA PARA COLOCAR O NO LABELS
          this.legend = screen.width < 575 ? false : true;
          // MAPEO DE PORCENTAJES PARA MOSTRAR EN PANTALLA
          this.servicio = servicio.turnos;
          let total = servicio.turnos.map((res) => res.queja_cantidad);
          let tipo = servicio.turnos.map((res) => res.quejas_emi_categoria);
          let Nombres: any = [];
          let totalPorc = 0;
          for (var i = 0; i < tipo.length; i++) {
            totalPorc = totalPorc + total[i];
          }
          for (var i = 0; i < tipo.length; i++) {
            Nombres.push(
              tipo[i] +
              "\n" +
              Math.round(((total[i] * 100) / totalPorc) * 1000) / 1000 +
              "%"
            );
          }

          // SE CREA EL GRAFICO
          this.chartPie = new Chart("canvas3", {
            // EL TIPO DE GRAFICO
            type: (this.tipo = "pie"),
            data: {
              labels: Nombres, // EJE X
              datasets: [
                {
                  label: "Total",
                  data: total, // EJE Y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",

                    "rgba(104, 210, 34, 0.6)",
                  ],
                },
              ],
            },
            // SE SETEA TITULO ASI COMO VALORES EN GRAFICO
            options: {

              plugins: {
                title: {
                  display: true,
                },
                datalabels: {
                  color: "black",
                  labels: {
                    title: {
                      color: "blue",
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
          // SE CREA SEGUNDO GRAFICO
          this.chartBar = new Chart("canvas4", {
            // TIPO DE GRÁFICO BAR
            type: (this.tipo = "bar"),
            data: {
              labels: Nombres, // EJE X
              datasets: [
                {
                  label: "Total",
                  data: total, // EJE Y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",

                    "rgba(104, 210, 34, 0.6)",
                  ],
                },
              ],
            },
            options: {
              scales: {
                /* xAxes: [
                   {
                     ticks: {
                       display: this.legend,
                     },
                   },
                 ],*/
              },
              plugins: {
                title: {
                  display: true,
                },
                legend: {
                  display: false,
                },
              },

              responsive: true,
            },
          });
        },
        (error) => {
          if (error.status == 400) {
            // POR ERROR 400 SE VACIA VARIABLE DE CONSULTA
            this.servicio = null;
          }
        }
      );
    }
    /** SI CHART ES VACIO NO PASE NADA, CASO CONTRARIO SI TIENEN YA DATOS, SE DESTRUYA PARA CREAR UNO NUEVO,
     *  EVITANDO SUPERPOSISION DEL NUEVO CHART
     **/
    if (this.chartPie != undefined || this.chartPie != null) {
      this.chartPie.destroy();
    }
    if (this.chartBar != undefined || this.chartBar != null) {
      this.chartBar.destroy();
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
  exportTOExcelOpiniones() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesI || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioOpinion.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioOpinion[step].empresa_empr_nombre,
          Tipo: this.servicioOpinion[step].quejas_emi_tipo,
          Categoría: this.servicioOpinion[step].quejas_emi_categoria,
          Fecha: new Date(this.servicioOpinion[step].quejas_emi_fecha),
          Hora: this.servicioOpinion[step].hora,
          Caja: this.servicioOpinion[step].caja_caja_nombre,
          Opinión: this.servicioOpinion[step].quejas_emi_queja,
        });
      }
    } else {
      for (let step = 0; step < this.servicioOpinion.length; step++) {
        jsonServicio.push({
          Tipo: this.servicioOpinion[step].quejas_emi_tipo,
          Categoría: this.servicioOpinion[step].quejas_emi_categoria,
          Fecha: new Date(this.servicioOpinion[step].quejas_emi_fecha),
          Hora: this.servicioOpinion[step].hora,
          Caja: this.servicioOpinion[step].caja_caja_nombre,
          Opinión: this.servicioOpinion[step].quejas_emi_queja,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioOpinion[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(
      wb,
      "informeOpinionesExcel - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportTOExcelOpinionesIC() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesIC || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioOpinionIC.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioOpinionIC[step].empresa_empr_nombre,
          Tipo: this.servicioOpinionIC[step].quejas_emi_tipo,
          Categoría: this.servicioOpinionIC[step].quejas_emi_categoria,
          Fecha: new Date(this.servicioOpinionIC[step].quejas_emi_fecha),
          Hora: this.servicioOpinionIC[step].hora,
          Caja: this.servicioOpinionIC[step].caja_caja_nombre,
          Opinión: this.servicioOpinionIC[step].quejas_emi_queja,
        });
      }
    } else {
      for (let step = 0; step < this.servicioOpinionIC.length; step++) {
        jsonServicio.push({
          Tipo: this.servicioOpinionIC[step].quejas_emi_tipo,
          Categoría: this.servicioOpinionIC[step].quejas_emi_categoria,
          Fecha: new Date(this.servicioOpinionIC[step].quejas_emi_fecha),
          Hora: this.servicioOpinionIC[step].hora,
          Caja: this.servicioOpinionIC[step].caja_caja_nombre,
          Opinión: this.servicioOpinionIC[step].quejas_emi_queja,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioOpinionIC[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(
      wb,
      "informeOpinionesExcel - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportTOExcelOpinionesGrafico() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesG || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioocg.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioocg[step].empresa_empr_nombre,
          Tipo: this.servicioocg[step].quejas_emi_tipo,
          Cantidad: this.servicioocg[step].queja_cantidad,
        });
      }
    } else {
      for (let step = 0; step < this.servicioocg.length; step++) {
        jsonServicio.push({
          Tipo: this.servicioocg[step].quejas_emi_tipo,
          Cantidad: this.servicioocg[step].queja_cantidad,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioocg[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(
      wb,
      "informeOpinionesExcel - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  exportTOExcelOpinionesGraficoIC() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesGIC || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioocgIC.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioocgIC[step].empresa_empr_nombre,
          Tipo: this.servicioocgIC[step].quejas_emi_tipo,
          Categoria: this.servicioocgIC[step].quejas_emi_categoria,
          Cantidad: this.servicioocgIC[step].queja_cantidad,
        });
      }
    } else {
      for (let step = 0; step < this.servicioocgIC.length; step++) {
        jsonServicio.push({
          Tipo: this.servicioocgIC[step].quejas_emi_tipo,
          Categoria: this.servicioocgIC[step].quejas_emi_categoria,
          Cantidad: this.servicioocgIC[step].queja_cantidad,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioocgIC[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Informe");
    XLSX.writeFile(
      wb,
      "informeOpinionesExcelG - " + nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  //---PDF
  generarPdfOpiniones(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fromDateAtM.nativeElement.value.toString().trim();
    var fH = this.toDateAtM.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentOpiniones(fD, fH);
    } else if (pdf === 2) {
      documentDefinition = this.getDocumentOpinionesGraficos(fD, fH);
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
  getDocumentOpiniones(fD: any, fH: any) {
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
      pageOrientation: 'landscape',
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
              text: "Reporte - Informe de opiniones",
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
          text: "Periodo  de " + fD + " hasta " + fH,
        },
        this.opiniones(this.servicioOpinion), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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
        itemsTable: { fontSize: 8, margin: [5, 5, 5, 5] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [80, 5, 80, 40], alignment: "center" },
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

  generarPdfOpinionesIC(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fromDateIC.nativeElement.value.toString().trim();
    var fH = this.toDateIC.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentOpinionesIC(fD, fH);
    } else if (pdf === 2) {
      documentDefinition = this.getDocumentOpinionesGraficosIC(fD, fH);
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
  getDocumentOpinionesIC(fD, fH) {
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
      pageOrientation: 'landscape',
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
              text: "Reporte - Informe de opiniones",
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
          text: "Periodo  de " + fD + " hasta " + fH,
        },
        this.opinionesIC(this.servicioOpinionIC), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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
        itemsTable: { fontSize: 8, margin: [5, 5, 5, 5] },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: {
          fontSize: 16,
          alignment: "center",
          margin: [0, 5, 0, 10],
        },
        tableMargin: { margin: [80, 5, 80, 40], alignment: "center" },
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentOpinionesGraficos(fD: any, fH: any) {
    // SELECCIONA DE LA INTERFAZ EL ELEMENTO QUE CONTIENE LA GRAFICA
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    var canvas2 = document.querySelector("#canvas2") as HTMLCanvasElement;
    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    var canvasImg = canvas1.toDataURL("image/png");
    var canvasImg1 = canvas2.toDataURL("image/png");
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
              text: "Reporte - Opiniones",
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
        this.opinionesGraficos(this.servicioocg),
        this.grafico(canvasImg),
        this.grafico(canvasImg1), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  getDocumentOpinionesGraficosIC(fD: any, fH: any) {
    // SELECCIONA DE LA INTERFAZ EL ELEMENTO QUE CONTIENE LA GRAFICA
    var canvas1 = document.querySelector("#canvas3") as HTMLCanvasElement;
    var canvas2 = document.querySelector("#canvas4") as HTMLCanvasElement;
    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    var canvasImg = canvas1.toDataURL("image/png");
    var canvasImg1 = canvas2.toDataURL("image/png");
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
              text: "Reporte - Opiniones",
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
        this.opinionesGraficosIC(this.servicioocgIC),
        this.grafico(canvasImg),
        this.grafico(canvasImg1), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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
        pageBreak: "before",
      };
    } else {
      return {
        image: imagen,
        fit: [500, 350],
        margin: [0, 50, 0, 0],
        alignment: "center",
      };
    }
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF la estructura
  opiniones(servicio: any[]) {
    if (this.todasSucursalesI || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          alignment: "center",
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "auto", "auto", "*"],

          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoría", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Hora", style: "tableHeader" },
              { text: "Caja", style: "tableHeader" },
              { text: "Opinión", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.empresa_empr_nombre },
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.quejas_emi_fecha },
                { style: "itemsTable", text: res.hora },
                { style: "itemsTable", text: res.caja_caja_nombre },
                { style: "itemsTable", alignment: "left", text: res.quejas_emi_queja },
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
          alignment: "center",
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "auto", "*"],

          body: [
            [
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoría", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Hora", style: "tableHeader" },
              { text: "Caja", style: "tableHeader" },
              { text: "Opinión", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.quejas_emi_fecha },
                { style: "itemsTable", text: res.hora },
                { style: "itemsTable", text: res.caja_caja_nombre },
                { style: "itemsTable", alignment: "left", text: res.quejas_emi_queja },
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

  opinionesIC(servicio: any[]) {
    if (this.todasSucursalesIC || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          alignment: "center",
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "auto", "auto", "*"],

          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoría", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Hora", style: "tableHeader" },
              { text: "Caja", style: "tableHeader" },
              { text: "Opinión", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.empresa_empr_nombre },
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.quejas_emi_fecha },
                { style: "itemsTable", text: res.hora },
                { style: "itemsTable", text: res.caja_caja_nombre },
                { style: "itemsTable", alignment: "left", text: res.quejas_emi_queja },
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
          alignment: "center",
          headerRows: 1,
          widths: ["auto", "auto", "auto", "auto", "auto", "*"],

          body: [
            [
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoría", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Hora", style: "tableHeader" },
              { text: "Caja", style: "tableHeader" },
              { text: "Opinión", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.quejas_emi_fecha },
                { style: "itemsTable", text: res.hora },
                { style: "itemsTable", text: res.caja_caja_nombre },
                { style: "itemsTable", alignment: "left", text: res.quejas_emi_queja },
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF la estructura
  opinionesGraficos(servicio: any[]) {
    if (this.todasSucursalesG || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          alignment: "center",
          headerRows: 1,
          widths: ["*", "*", "*"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Tipo", style: "tableHeader" },
              { text: "Cantidad", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.empresa_empr_nombre },
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.queja_cantidad },
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
          alignment: "center",
          headerRows: 1,
          widths: ["*", "*"],
          body: [
            [
              { text: "Tipo", style: "tableHeader" },
              { text: "Cantidad", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.queja_cantidad },
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

  opinionesGraficosIC(servicio: any[]) {
    if (this.todasSucursalesGIC || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          alignment: "center",
          headerRows: 1,
          widths: ["*", "*", "*", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoria", style: "tableHeader" },
              { text: "Cantidad", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.empresa_empr_nombre },
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.queja_cantidad },
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
          alignment: "center",
          headerRows: 1,
          widths: ["*", "*", "auto"],
          body: [
            [
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoria", style: "tableHeader" },
              { text: "Cantidad", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.queja_emi_categoria },
                { style: "itemsTable", text: res.queja_cantidad },
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
}
