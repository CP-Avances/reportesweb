import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { Chart } from "chart.js";
import { ServiceService } from "../../services/service.service";
import { AuthenticationService } from "../../services/authentication.service";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { ToastrService } from "ngx-toastr";

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
  selector: "app-atencion",
  templateUrl: "./atencion.component.html",
  styleUrls: ["./atencion.component.scss"],
})
export class AtencionComponent implements OnInit {
  //Seteo de fechas primer dia del mes actual y dia actua
  fromDate;
  toDate;
  //captura de elementos de la interfaz visual para tratarlos y capturar datos
  @ViewChild("fromDateAtTC") fromDateAtTC: ElementRef;
  @ViewChild("toDateAtTC") toDateAtTC: ElementRef;
  @ViewChild("fromDateAtPA") fromDateAtPA: ElementRef;
  @ViewChild("toDateAtPA") toDateAtPA: ElementRef;
  @ViewChild("fromDateAtMA") fromDateAtMA: ElementRef;
  @ViewChild("toDateAtMA") toDateAtMA: ElementRef;
  @ViewChild("fromDateAtAS") fromDateAtAS: ElementRef;
  @ViewChild("toDateAtAS") toDateAtAS: ElementRef;
  @ViewChild("fromDateAtG") fromDateAtG: ElementRef;
  @ViewChild("toDateAtG") toDateAtG: ElementRef;

  @ViewChild("codCajeroAtTC") codCajeroAtTC: ElementRef;
  @ViewChild("codServicioAtPA") codServicioAtPA: ElementRef;
  @ViewChild("codServicioAtMA") codServicioAtMA: ElementRef;
  @ViewChild("codCajeroAtAS") codCajeroAtAS: ElementRef;

  @ViewChild("codSucursalAtGs") codSucursalAtGs: ElementRef;
  @ViewChild("codSucursalAtTC") codSucursalAtTC: ElementRef;
  @ViewChild("codSucursalAtPA") codSucursalAtPA: ElementRef;
  @ViewChild("codSucursalAtMA") codSucursalAtMA: ElementRef;
  @ViewChild("codSucursalAtAS") codSucursalAtAS: ElementRef;

  //Servicios-Variables donde se almacenaran las consultas a la BD
  servicioTiempoComp: any = [];
  serviciopa: any = [];
  serviciomax: any = [];
  servicioatser: any = [];
  serviciograf: any = [];
  serviciosAtPA: any = [];
  cajerosAtencion: any = [];
  sucursales: any[];
  //Variable usada en exportacion a excel
  p_color: any;
  //Banderas para mostrar la tabla correspondiente a las consultas
  todasSucursalesTC: boolean = false;
  todasSucursalesPA: boolean = false;
  todasSucursalesMA: boolean = false;
  todasSucursalesAS: boolean = false;
  todasSucursalesGS: boolean = false;
  //Banderas para que no se quede en pantalla consultas anteriores
  malRequestAtTC: boolean = false;
  malRequestAtTCPag: boolean = false;
  malRequestAtPA: boolean = false;
  malRequestAtPAPag: boolean = false;
  malRequestAtMA: boolean = false;
  malRequestAtMAPag: boolean = false;
  malRequestAtAS: boolean = false;
  malRequestAtASPag: boolean = false;
  malRequestAtG: boolean = false;
  malRequestAtGPag: boolean = false;
  //Usuario que ingreso al sistema
  userDisplayName: any;
  //Grafico
  tipo: string;
  chart: any;
  legend: any;
  //Maximo de items mostrado de tabla en pantalla
  private MAX_PAGS = 10;
  //Palabras de componente de paginacion
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };
  //Control paginacion
  configTC: any;
  configPA: any;
  configMA: any;
  configAS: any;
  configGS: any;
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
    public datePipe: DatePipe,
    private toastr: ToastrService
  ) {
    //Seteo de item de paginacion cuantos items por pagina, desde que pagina empieza, el total de items respectivamente
    this.configTC = {
      id: "Atenciontc",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTiempoComp.length,
    };
    this.configPA = {
      id: "Atencionpa",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.serviciopa.length,
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
  }
  //Eventos para avanzar o retroceder en la paginacion
  pageChangedTC(event) {
    this.configTC.currentPage = event;
  }
  pageChangedPA(event1) {
    this.configPA.currentPage = event1;
  }
  pageChangedMA(event) {
    this.configMA.currentPage = event;
  }
  pageChangedAS(event) {
    this.configAS.currentPage = event;
  }
  pageChangedGS(event) {
    this.configGS.currentPage = event;
  }

  ngOnInit(): void {
    //Cargamos componentes selects HTML
    this.getlastday();
    this.getCajeros("-1");
    this.getServicios("-1");
    this.getSucursales();
    //Cargamos nombre de usuario logueado
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    //Seteo de tipo de grafico
    this.tipo = "bar";
    //seteo orientacion
    this.orientacion = "portrait";
    //Seteo de banderas cuando el resultado de la peticion HTTP no es 200 OK
    this.malRequestAtTCPag = true;
    this.malRequestAtPAPag = true;
    this.malRequestAtMAPag = true;
    this.malRequestAtASPag = true;
    this.malRequestAtGPag = true;
    //Seteo de imagen en interfaz
    Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
      (result) => (this.urlImagen = result)
    );
  }

  //Se desloguea de la aplicacion
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  //Obtiene la fecha actual
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  //Funcion para llenar select con usuarios/cajeros existentes
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajeros: any) => {
      this.cajerosAtencion = cajeros.cajeros;
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosAtencion = [];
        }
      });
  }

  //Consulata para llenar la lista de surcursales.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  limpiar() {
    this.getCajeros("-1");
    this.getSucursales();
    this.getServicios("-1");
  }

  //Comprueba si se realizo una busqueda por sucursales
  comprobarBusquedaSucursales(cod: string) {
    console.log(cod);
    return cod == "-1" ? true : false;
  }

  //Cambio de tipo de grafico
  cambiar(tipo: string) {
    this.tipo = tipo;
    if (this.chart) {
      this.chart.destroy();
    }
    this.leerGrafico();
  }

  //cambio orientacion
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  //Consulta para llenar select de interfaz
  getServicios(sucursal: any) {
    this.serviceService.getAllServiciosS(sucursal).subscribe((serviciosAtPA: any) => {
      this.serviciosAtPA = serviciosAtPA.servicios;
    },
      (error) => {
        if (error.status == 400) {
          this.serviciosAtPA = [];
        }
      });
  }

  leerTiempcompleto() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateAtTC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTC.nativeElement.value.toString().trim();
    var cod = this.codCajeroAtTC.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtTC.nativeElement.value.toString().trim();
    this.serviceService
      .gettiemposcompletos(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (servicio: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioTiempoComp = servicio.turnos;
          this.malRequestAtTC = false;
          this.malRequestAtTCPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configTC.currentPage > 1) {
            this.configTC.currentPage = 1;
          }
          this.todasSucursalesTC = this.comprobarBusquedaSucursales(codSucursal);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioTiempoComp = null;
            this.malRequestAtTC = true;
            this.malRequestAtTCPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioTiempoComp == null) {
              this.configTC.totalItems = 0;
            } else {
              this.configTC.totalItems = this.servicioTiempoComp.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configTC = {
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

  leerPromAtencion() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateAtPA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtPA.nativeElement.value.toString().trim();
    var cod = this.codServicioAtPA.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtPA.nativeElement.value.toString().trim();
    this.serviceService
      .getpromatencion(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (serviciopa: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.serviciopa = serviciopa.turnos;
          this.malRequestAtPA = false;
          this.malRequestAtPAPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configPA.currentPage > 1) {
            this.configPA.currentPage = 1;
          }
          this.todasSucursalesPA = this.comprobarBusquedaSucursales(codSucursal);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.serviciopa = null;
            this.malRequestAtPA = true;
            this.malRequestAtPAPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.serviciopa == null) {
              this.configPA.totalItems = 0;
            } else {
              this.configPA.totalItems = this.serviciopa.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configPA = {
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

  leerMaxAtencion() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateAtMA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtMA.nativeElement.value.toString().trim();
    var cod = this.codServicioAtMA.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtMA.nativeElement.value.toString().trim();
    this.serviceService
      .getmaxatencion(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (serviciomax: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.serviciomax = serviciomax.turnos;
          this.malRequestAtMA = false;
          this.malRequestAtMAPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configMA.currentPage > 1) {
            this.configMA.currentPage = 1;
          }
          this.todasSucursalesMA = this.comprobarBusquedaSucursales(codSucursal);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.serviciomax = null;
            this.malRequestAtMA = true;
            this.malRequestAtMAPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.serviciomax == null) {
              this.configMA.totalItems = 0;
            } else {
              this.configMA.totalItems = this.serviciomax.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configMA = {
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

  leerAtencionServicio() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateAtAS.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtAS.nativeElement.value.toString().trim();
    var cod = this.codCajeroAtAS.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtAS.nativeElement.value.toString().trim();

    this.serviceService
      .getatencionservicio(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (servicioatser: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioatser = servicioatser.turnos;
          this.malRequestAtAS = false;
          this.malRequestAtASPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configAS.currentPage > 1) {
            this.configAS.currentPage = 1;
          }
          this.todasSucursalesAS = this.comprobarBusquedaSucursales(codSucursal);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioatser = null;
            this.malRequestAtAS = true;
            this.malRequestAtASPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioatser == null) {
              this.configAS.totalItems = 0;
            } else {
              this.configAS.totalItems = this.servicioatser.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configAS = {
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

  leerGrafico() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateAtG.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtG.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtGs.nativeElement.value.toString().trim();

    this.serviceService.getatenciongrafico(fechaDesde, fechaHasta, cod).subscribe(
      (serviciograf: any) => {
        //verificacion de ancho de pantalla para mostrar o no labels
        this.legend = screen.width < 575 ? false : true;
        //Si se consulta correctamente se guarda en variable y setea banderas de tablas
        this.serviciograf = serviciograf.turnos;
        this.malRequestAtG = false;
        this.malRequestAtGPag = false;
        //Seteo de paginacion cuando se hace una nueva busqueda
        if (this.configGS.currentPage > 1) {
          this.configGS.currentPage = 1;
        }
        this.todasSucursalesGS = this.comprobarBusquedaSucursales(cod);
        //Mapeo de datos para imprimir en grafico
        let Nombres = serviciograf.turnos.map((res) => res.Servicio);
        let totales = serviciograf.turnos.map((res) => res.Total);
        let atendidos = serviciograf.turnos.map((res) => res.Atendidos);
        let noAtendidos = serviciograf.turnos.map((res) => res.No_Atendidos);

        //Seteo de cada grupo de datos
        var atendidosData = {
          label: "Atendidos",
          data: atendidos,
          backgroundColor: "rgba(0, 99, 132, 0.6)",
        };
        var noAtendidosData = {
          label: "No Atendidos",
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

        //Creacion del grafico
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
          //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
          this.serviciograf = null;
          this.malRequestAtG = true;
          this.malRequestAtGPag = true;
          //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
          //caso contrario se setea la cantidad de elementos
          if (this.serviciograf == null) {
            this.configGS.totalItems = 0;
          } else {
            this.configGS.totalItems = this.serviciograf.length;
          }
          //Por error 400 se setea elementos de paginacion
          this.configGS = {
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
    //Si chart es vacio no pase nada, caso contrario si tienen ya datos, se destruya para crear uno nuevo, evitando superposision del nuevo chart
    if (this.chart != undefined || this.chart != null) {
      this.chart.destroy();
    }
  }

  obtenerNombreSucursal(cod: string) {
    if (cod == "-1") {
      return "Todas las sucursales"
    } else {
      let nombreSucursal = (this.sucursales.find(sucursal => sucursal.empr_codigo == cod)).empr_nombre;
      return nombreSucursal;
    }
  }

  //---EXCEL
  exportarAExcelTiempoComp() {
    let cod = this.codSucursalAtTC.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesTC) {
      for (let step = 0; step < this.servicioTiempoComp.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioTiempoComp[step].nombreEmpresa,
          Usuario: this.servicioTiempoComp[step].Usuario,
          Servicio: this.servicioTiempoComp[step].Servicio,
          Fecha: this.servicioTiempoComp[step].Fecha,
          "Tiempo Espera": this.servicioTiempoComp[step].Tiempo_Espera,
          "Tiempo Atención": this.servicioTiempoComp[step].Tiempo_Atencion,
        });
      }
    } else {
      for (let step = 0; step < this.servicioTiempoComp.length; step++) {
        jsonServicio.push({
          Usuario: this.servicioTiempoComp[step].Usuario,
          Servicio: this.servicioTiempoComp[step].Servicio,
          Fecha: this.servicioTiempoComp[step].Fecha,
          "Tiempo Espera": this.servicioTiempoComp[step].Tiempo_Espera,
          "Tiempo Atención": this.servicioTiempoComp[step].Tiempo_Atencion,
        });
      }
    }

    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioTiempoComp[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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

  exportarAExcelPromAtencion() {
    let cod = this.codSucursalAtPA.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesPA) {
      for (let step = 0; step < this.serviciopa.length; step++) {
        jsonServicio.push({
          Sucursal: this.serviciopa[step].nombreEmpresa,
          Servicios: this.serviciopa[step].SERV_NOMBRE,
          Fecha: this.serviciopa[step].TURN_FECHA,
          "T. Promedio de Espera": this.serviciopa[step].PromedioEspera,
          "T. Promedio de Atención": this.serviciopa[step].PromedioAtencion,
        });
      }
    } else {
      for (let step = 0; step < this.serviciopa.length; step++) {
        jsonServicio.push({
          Servicios: this.serviciopa[step].SERV_NOMBRE,
          Fecha: this.serviciopa[step].TURN_FECHA,
          "T. Promedio de Espera": this.serviciopa[step].PromedioEspera,
          "T. Promedio de Atención": this.serviciopa[step].PromedioAtencion,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciopa[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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

  exportarAExcelMaxAtencion() {
    let cod = this.codSucursalAtMA.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesMA) {
      for (let step = 0; step < this.serviciomax.length; step++) {
        jsonServicio.push({
          Sucursal: this.serviciomax[step].nombreEmpresa,
          Cod: this.serviciomax[step].SERV_CODIGO,
          Servicio: this.serviciomax[step].SERV_NOMBRE,
          Fecha: this.serviciomax[step].Fecha,
          "T. Máximo de Atención": this.serviciomax[step].Maximo,
        });
      }
    } else {
      for (let step = 0; step < this.serviciomax.length; step++) {
        jsonServicio.push({
          Cod: this.serviciomax[step].SERV_CODIGO,
          Servicio: this.serviciomax[step].SERV_NOMBRE,
          Fecha: this.serviciomax[step].Fecha,
          "T. Máximo de Atención": this.serviciomax[step].Maximo,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciomax[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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
    let cod = this.codSucursalAtAS.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesAS) {
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
    } else {
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
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioatser[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
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
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    for (let step = 0; step < this.serviciograf.length; step++) {
      jsonServicio.push({
        Servicio: this.serviciograf[step].Servicio,
        Atendidos: this.serviciograf[step].Atendidos,
        "No Atendidos": this.serviciograf[step].No_Atendidos,
        Total: this.serviciograf[step].Total,
      });
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciograf[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(
      wb,
      "at-graficoservicio" +
      "_export_" +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  //PDF'S
  generarPdfTiempoComp(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateAtTC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTC.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtTC.nativeElement.value.toString().trim();
    let documentDefinition;
    //Definicion de funcion delegada para setear estructura del PDF
    if (pdf === 1) {
      documentDefinition = this.getDocumentTiempoCompleto(
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
  getDocumentTiempoCompleto(fechaDesde, fechaHasta, cod) {
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
        this.tiempocompleto(this.servicioTiempoComp), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  tiempocompleto(servicio: any[]) {
    if (this.todasSucursalesTC) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Usuario", style: "tableHeader" },
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
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Usuario", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfPromAtencion(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateAtPA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtPA.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtPA.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentPromedioAtencion(
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
  getDocumentPromedioAtencion(fechaDesde, fechaHasta, cod) {
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
        this.promediosatencion(this.serviciopa), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  promediosatencion(servicio: any[]) {
    if (this.todasSucursalesPA) {
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfMaxAtencion(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateAtMA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtMA.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtMA.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentMaxAtencion(fechaDesde, fechaHasta, cod);
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

  getDocumentMaxAtencion(fechaDesde, fechaHasta, cod) {
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
        this.maxatencion(this.serviciomax), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  maxatencion(servicio: any[]) {
    if (this.todasSucursalesMA) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cod.", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "T. Promedio de Espera", style: "tableHeader" },
              { text: "T. Promedio de Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.SERV_CODIGO },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Maximo },
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
          widths: ["auto", "*", "auto", "auto"],
          body: [
            [
              { text: "Cod.", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "T. Promedio de Espera", style: "tableHeader" },
              { text: "T. Promedio de Atención", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.SERV_CODIGO },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Maximo },
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

  generarPdfAtServ(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateAtAS.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtAS.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtAS.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionServicio(
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
  getDocumentAtencionServicio(fechaDesde, fechaHasta, cod) {
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
        this.atencionservicio(this.servicioatser), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  atencionservicio(servicio: any[]) {
    if (this.todasSucursalesAS) {
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
              { text: "No Atendidos", style: "tableHeader" },
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
          widths: ["*", "auto", "auto", "auto", "auto"],
          body: [
            [
              { text: "Nombre.", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No Atendidos", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPdfGraServ(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateAtG.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtG.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtGs.nativeElement.value.toString().trim();

    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionServicioGraf(
        fechaDesde,
        fechaHasta,
        cod
      );
      //Generacion pdf del grafico
      // this.generarPDFGrafico();
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
  getDocumentAtencionServicioGraf(fechaDesde, fechaHasta, cod) {
    //Selecciona de la interfaz el elemento que contiene la grafica
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    //De imagen HTML, a mapa64 bits formato con el que trabaja PDFMake
    var canvasImg = canvas1.toDataURL("image/png");

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
        this.grafico(canvasImg), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  atenciongrafservicio(servicio: any[]) {
    if (this.todasSucursalesGS) {
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
              { text: "No Atendidos", style: "tableHeader" },
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
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Servicio.", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No Atendidos", style: "tableHeader" },
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
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? "#E5E7E9" : null;
          },
        },
      };
    }
  }

  generarPDFGrafico() {
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
    let textEnc = "Reporte - Gráfico Atención Servicios";
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
    doc.save(`Gráfico-Atención ${fecha}, ${timer}.pdf`);
    window.open(URL.createObjectURL(doc.output("blob")));
  }
}
