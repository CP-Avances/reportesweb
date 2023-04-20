import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ServiceService } from "../../services/service.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from "../../services/authentication.service";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { Chart } from "chart.js";
import { ToastrService } from "ngx-toastr";

//Complementos para PDF y Excel
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
  //Seteo de fechas primer dia del mes actual y dia actual
  fromDate;
  toDate;
  //captura de elementos de la interfaz visual para tratarlos y capturar datos
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


  //Variables de la grafica
  chartPie: any;
  chartBar: any;
  tipo: string;

  //Servicios-Variables donde se almacenaran las consultas a la BD
  servicioOpinionIC: any = [];
  servicioOpinion: any = [];
  servicioocg: any = [];
  servicioocgIC: any = [];
  categorias: any[];
  sucursales: any[];
  servicio: any;

  //Variable usada en exportacion a excel
  p_color: any;

  //Banderas para mostrar la tabla correspondiente a las consultas
  todasSucursalesI: boolean = false;
  todasSucursalesIC: boolean = false;
  todasSucursalesG: boolean = false;
  todasSucursalesGIC: boolean = false;
  todasCategorias: boolean = false;
  todosTipos: boolean = false;

  //Banderas para que no se quede en pantalla consultas anteriores
  malRequestAtM: boolean = false;
  malRequestAtMIC: boolean = false;
  malRequestAtMPag: boolean = false;
  malRequestAtMICPag: boolean = false;
  malRequestIC: boolean = false;
  malRequestICPag: boolean = false;
  malRequestOcupG: boolean = false;

  //Usuario que ingreso al sistema
  userDisplayName: any;

  //Control paginacion
  configAtM: any;
  configAtMIC: any;
  configIC: any;
  private MAX_PAGS = 10;

  //Palabras de componente de paginacion
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };

  //Control de labels por ancho de pantalla
  legend: any;

  //Obtiene fecha actual para colocarlo en cuadro de fecha
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year + "-" + this.month + "-" + this.day;

  //Imagen Logo
  urlImagen: string;

  //OPCIONES MULTIPLES
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

  //Orientacion
  orientacion: string;

  //Infotmación
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  mostrarCategorias: boolean = false;

  constructor(
    private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router,
    public datePipe: DatePipe,
    private toastr: ToastrService,
    private imagenesService: ImagenesService
  ) {
    //Seteo de item de paginacion cuantos items por pagina, desde que pagina empieza, el total de items respectivamente
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

  //Eventos para avanzar o retroceder en la paginacion
  pageChangedAtM(event) {
    this.configAtM.currentPage = event;
  }

  pageChangedIC(event) {
    this.configIC.currentPage = event;
  }

  ngOnInit(): void {
    //Cargamos tipo de grafico
    this.tipo = "pie";
    //seteo orientacion
    this.orientacion = "portrait";
    //Cargamos componentes selects HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    //Cargamos nombre de usuario logueado
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    //Seteo de banderas cuando el resultado de la peticion HTTP no es 200 OK
    this.malRequestAtMPag = true;
    this.malRequestICPag = true;
    // CARGAR LOGO PARA LOS REPORTES
    this.imagenesService.cargarImagen().then((result: string) => {
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

  //Se obtiene dia actual
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  //Consulata para llenar la lista de surcursales.
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

  //Comprueba si se realizo una busqueda por sucursales
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  //cambio orientacion
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  leerOpiniones() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateAtM.nativeElement.value.toString().trim();
    var fH = this.toDateAtM.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioI.nativeElement.value;
    let horaFin = this.horaFinI.nativeElement.value;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getopiniones(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicio: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioOpinion = servicio.turnos;
          this.servicioOpinion.forEach(dato => {
            if (dato.caja_caja_nombre === '0') {
              dato.caja_caja_nombre = ' ';
            }
          })
          this.malRequestAtM = false;
          this.malRequestAtMPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configAtM.currentPage > 1) {
            this.configAtM.currentPage = 1;
          }
          // this.todasSucursalesI = this.comprobarBusquedaSucursales(cod);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioOpinion = null;
            this.malRequestAtM = true;
            this.malRequestAtMPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioOpinion == null) {
              this.configAtM.totalItems = 0;
            } else {
              this.configAtM.totalItems = this.servicioOpinion.length;
            }

            //Por error 400 se setea elementos de paginacion
            this.configAtM = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1,
            };
            //Se informa que no se encontraron registros
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        }
      );
    }
  }

  leerOpinionesC() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateIC.nativeElement.value.toString().trim();
    var fH = this.toDateIC.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioIC.nativeElement.value;
    let horaFin = this.horaFinIC.nativeElement.value;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados, this.categoriasSeleccionadas).subscribe(
        (servicio: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioOpinionIC = servicio.turnos;
          this.servicioOpinionIC.forEach(dato => {
            if (dato.caja_caja_nombre === '0') {
              dato.caja_caja_nombre = ' ';
            }
          })
          this.malRequestIC = false;
          this.malRequestICPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configIC.currentPage > 1) {
            this.configIC.currentPage = 1;
          }
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioOpinionIC = null;
            this.malRequestIC = true;
            this.malRequestICPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioOpinionIC == null) {
              this.configIC.totalItems = 0;
            } else {
              this.configIC.totalItems = this.servicioOpinionIC.length;
            }

            //Por error 400 se setea elementos de paginacion
            this.configIC = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1,
            };
            //Se informa que no se encontraron registros
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        }
      );
    }
  }

  leerGrafOpinion() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateOcupG.nativeElement.value.toString().trim();
    var fH = this.toDateOcupG.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioG.nativeElement.value;
    let horaFin = this.horaFinG.nativeElement.value;

    this.malRequestAtM = false;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getgraficoopinion(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicioocg: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioocg = servicioocg.turnos;
          // this.malRequestAtM = false;
          this.malRequestAtMPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configAtM.currentPage > 1) {
            this.configAtM.currentPage = 1;
          }
          // this.todasSucursalesG = this.comprobarBusquedaSucursales(cod);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioocg = null;
            this.malRequestAtM = true;
            this.malRequestAtMPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioocg == null) {
              this.configAtM.totalItems = 0;
            } else {
              this.configAtM.totalItems = this.servicioocg.length;
            }

            //Por error 400 se setea elementos de paginacion
            this.configAtM = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1,
            };
            //Se informa que no se encontraron registros
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        }
      );

      this.serviceService.getgraficoopinion(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicio: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          //Se verifica el ancho de pantalla para colocar o no labels
          this.legend = screen.width < 575 ? false : true;
          //Mapeo de porcentajes para mostrar en pantalla
          this.servicio = servicio.turnos;
          let total = servicio.turnos.map((res) => res.queja_cantidad);
          let tipo = servicio.turnos.map((res) => res.quejas_emi_tipo);
          let Nombres = [];
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

          //Se crea el grafico
          this.chartPie = new Chart("canvas", {
            //El tipo de grafico
            type: (this.tipo = "pie"),
            data: {
              labels: Nombres, //eje x
              datasets: [
                {
                  label: "Total",
                  data: total, //eje y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",
                    ///////////////////////////F
                    "rgba(104, 210, 34, 0.6)",
                  ],
                },
              ],
            },
            //Se setea titulo asi como valores en grafico
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
          //Se crea segundo grafico
          this.chartBar = new Chart("canvas2", {
            //Tipo de gráfico bar
            type: (this.tipo = "bar"),
            data: {
              labels: Nombres, //eje x
              datasets: [
                {
                  label: "Total",
                  data: total, //eje y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",
                    ///////////////////////////F
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
            //Por error 400 se vacia variable de consulta
            this.servicio = null;
          }
        }
      );
    }
    //Si chart es vacio no pase nada, caso contrario si tienen ya datos, se destruya para crear uno nuevo, evitando superposision del nuevo chart
    if (this.chartPie != undefined || this.chartPie != null) {
      this.chartPie.destroy();
    }
    if (this.chartBar != undefined || this.chartBar != null) {
      this.chartBar.destroy();
    }
  }

  leerGrafOpinionIC() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateOcupGIC.nativeElement.value.toString().trim();
    var fH = this.toDateOcupGIC.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioGIC.nativeElement.value;
    let horaFin = this.horaFinGIC.nativeElement.value;

    this.malRequestAtMIC = false;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getgraficoopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicioocgIC: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioocgIC = servicioocgIC.turnos;
          // this.malRequestAtM = false;
          this.malRequestAtMICPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configAtMIC.currentPage > 1) {
            this.configAtMIC.currentPage = 1;
          }
          // this.todasSucursalesG = this.comprobarBusquedaSucursales(cod);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioocgIC = null;
            this.malRequestAtMIC = true;
            this.malRequestAtMICPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioocgIC == null) {
              this.configAtMIC.totalItems = 0;
            } else {
              this.configAtMIC.totalItems = this.servicioocgIC.length;
            }

            //Por error 400 se setea elementos de paginacion
            this.configAtMIC = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1,
            };
            //Se informa que no se encontraron registros
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        }
      );

      this.serviceService.getgraficoopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicio: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          //Se verifica el ancho de pantalla para colocar o no labels
          this.legend = screen.width < 575 ? false : true;
          //Mapeo de porcentajes para mostrar en pantalla
          this.servicio = servicio.turnos;
          let total = servicio.turnos.map((res) => res.queja_cantidad);
          let tipo = servicio.turnos.map((res) => res.quejas_emi_categoria);
          let Nombres = [];
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

          //Se crea el grafico
          this.chartPie = new Chart("canvas3", {
            //El tipo de grafico
            type: (this.tipo = "pie"),
            data: {
              labels: Nombres, //eje x
              datasets: [
                {
                  label: "Total",
                  data: total, //eje y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",
                    ///////////////////////////F
                    "rgba(104, 210, 34, 0.6)",
                  ],
                },
              ],
            },
            //Se setea titulo asi como valores en grafico
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
          //Se crea segundo grafico
          this.chartBar = new Chart("canvas4", {
            //Tipo de gráfico bar
            type: (this.tipo = "bar"),
            data: {
              labels: Nombres, //eje x
              datasets: [
                {
                  label: "Total",
                  data: total, //eje y
                  backgroundColor: [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 206, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)",
                    "rgba(255, 159, 64, 0.6)",
                    ///////////////////////////F
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
            //Por error 400 se vacia variable de consulta
            this.servicio = null;
          }
        }
      );
    }
    //Si chart es vacio no pase nada, caso contrario si tienen ya datos, se destruya para crear uno nuevo, evitando superposision del nuevo chart
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

  //---Excel
  exportTOExcelOpiniones() {
    // let cod = this.codSucursalAtM.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesI || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioOpinion.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioOpinion[step].empresa_empr_nombre,
          Tipo: this.servicioOpinion[step].quejas_emi_tipo,
          Categoría: this.servicioOpinion[step].quejas_emi_categoria,
          Fecha: this.servicioOpinion[step].quejas_emi_fecha,
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
          Fecha: this.servicioOpinion[step].quejas_emi_fecha,
          Hora: this.servicioOpinion[step].hora,
          Caja: this.servicioOpinion[step].caja_caja_nombre,
          Opinión: this.servicioOpinion[step].quejas_emi_queja,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioOpinion[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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
    // let cod = this.codSucursalAtM.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
      if (this.todasSucursalesIC || this.seleccionMultiple) {
        for (let step = 0; step < this.servicioOpinionIC.length; step++) {
          jsonServicio.push({
            Sucursal: this.servicioOpinionIC[step].empresa_empr_nombre,
            Tipo: this.servicioOpinionIC[step].quejas_emi_tipo,
            Categoría: this.servicioOpinionIC[step].quejas_emi_categoria,
            Fecha: this.servicioOpinionIC[step].quejas_emi_fecha,
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
            Fecha: this.servicioOpinionIC[step].quejas_emi_fecha,
            Hora: this.servicioOpinionIC[step].hora,
            Caja: this.servicioOpinionIC[step].caja_caja_nombre,
            Opinión: this.servicioOpinionIC[step].quejas_emi_queja,
          });
        }
      }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioOpinionIC[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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
    // let cod = this.codSucursalOcupG.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
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
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioocg[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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
    // let cod = this.codSucursalOcupG.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
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
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioocgIC[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fD = this.fromDateAtM.nativeElement.value.toString().trim();
    var fH = this.toDateAtM.nativeElement.value.toString().trim();

    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      // var cod = this.codSucursalAtM.nativeElement.value.toString().trim();
      documentDefinition = this.getDocumentOpiniones(fD, fH);
    } else if (pdf === 2) {
      // var cod = this.codSucursalOcupG.nativeElement.value.toString().trim();
      documentDefinition = this.getDocumentOpinionesGraficos(fD, fH);
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
  getDocumentOpiniones(fD, fH) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
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
        this.opiniones(this.servicioOpinion), //Definicion de funcion delegada para setear informacion de tabla del PDF
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
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fD = this.fromDateIC.nativeElement.value.toString().trim();
    var fH = this.toDateIC.nativeElement.value.toString().trim();

    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      // var cod = this.codSucursalAtM.nativeElement.value.toString().trim();
      documentDefinition = this.getDocumentOpinionesIC(fD, fH);
    } else if (pdf === 2) {
      // var cod = this.codSucursalOcupG.nativeElement.value.toString().trim();
      documentDefinition = this.getDocumentOpinionesGraficosIC(fD, fH);
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
  getDocumentOpinionesIC(fD, fH) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
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
        this.opinionesIC(this.servicioOpinionIC), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Funcion delegada para seteo de información
  getDocumentOpinionesGraficos(fD, fH) {
    //Selecciona de la interfaz el elemento que contiene la grafica
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    var canvas2 = document.querySelector("#canvas2") as HTMLCanvasElement;
    //De imagen HTML, a mapa64 bits formato con el que trabaja PDFMake
    var canvasImg = canvas1.toDataURL("image/png");
    var canvasImg1 = canvas2.toDataURL("image/png");
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
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
        this.grafico(canvasImg1), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  getDocumentOpinionesGraficosIC(fD, fH) {
    //Selecciona de la interfaz el elemento que contiene la grafica
    var canvas1 = document.querySelector("#canvas3") as HTMLCanvasElement;
    var canvas2 = document.querySelector("#canvas4") as HTMLCanvasElement;
    //De imagen HTML, a mapa64 bits formato con el que trabaja PDFMake
    var canvasImg = canvas1.toDataURL("image/png");
    var canvasImg1 = canvas2.toDataURL("image/png");
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
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
        this.grafico(canvasImg1), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }
}
