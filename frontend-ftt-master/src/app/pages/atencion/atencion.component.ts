import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { Chart } from "chart.js";
import { Utils } from "../../utils/util";

import { AuthenticationService } from "../../services/authentication.service";
import { ServiceService } from "../../services/service.service";

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
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

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioTiempoComp: any = [];
  serviciopa: any = [];
  serviciomax: any = [];
  servicioatser: any = [];
  serviciograf: any = [];
  serviciosAtPA: any = [];
  cajerosAtencion: any = [];
  sucursales: any[];

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesTC: boolean = false;
  todasSucursalesPA: boolean = false;
  todasSucursalesMA: boolean = false;
  todasSucursalesAS: boolean = false;
  todasSucursalesGS: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
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
  configPA: any;
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

  // ORIENTACION
  orientacion: string;

  constructor(
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

  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedTC(event: any) {
    this.configTC.currentPage = event;
  }
  pageChangedPA(event1: any) {
    this.configPA.currentPage = event1;
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
    this.getCajeros("-1");
    this.getServicios("-1");
    this.getSucursales();

    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");

    // SETEO DE TIPO DE GRAFICO
    this.tipo = "bar";

    // SETEO ORIENTACION
    this.orientacion = "portrait";

    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestAtTCPag = true;
    this.malRequestAtPAPag = true;
    this.malRequestAtMAPag = true;
    this.malRequestAtASPag = true;
    this.malRequestAtGPag = true;

    // SETEO DE IMAGEN EN INTERFAZ
    Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
      (result) => (this.urlImagen = result)
    );
  }

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
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
    },
      (error) => {
        if (error.status == 400) {
          this.cajerosAtencion = [];
        }
      });
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
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
    },
      (error) => {
        if (error.status == 400) {
          this.serviciosAtPA = [];
        }
      });
  }

  leerTiempcompleto() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtTC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTC.nativeElement.value.toString().trim();
    var cod = this.codCajeroAtTC.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtTC.nativeElement.value.toString().trim();
    this.serviceService
      .gettiemposcompletos(fechaDesde, fechaHasta, parseInt(cod))
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
          this.todasSucursalesTC = this.comprobarBusquedaSucursales(codSucursal);
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

  leerPromAtencion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtPA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtPA.nativeElement.value.toString().trim();
    var cod = this.codServicioAtPA.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtPA.nativeElement.value.toString().trim();
    this.serviceService
      .getpromatencion(fechaDesde, fechaHasta, parseInt(cod))
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
          this.todasSucursalesPA = this.comprobarBusquedaSucursales(codSucursal);
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

  leerMaxAtencion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtMA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtMA.nativeElement.value.toString().trim();
    var cod = this.codServicioAtMA.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtMA.nativeElement.value.toString().trim();
    this.serviceService
      .getmaxatencion(fechaDesde, fechaHasta, parseInt(cod))
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
          this.todasSucursalesMA = this.comprobarBusquedaSucursales(codSucursal);
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

  leerAtencionServicio() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtAS.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtAS.nativeElement.value.toString().trim();
    var cod = this.codCajeroAtAS.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtAS.nativeElement.value.toString().trim();

    this.serviceService
      .getatencionservicio(fechaDesde, fechaHasta, parseInt(cod))
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
          this.todasSucursalesAS = this.comprobarBusquedaSucursales(codSucursal);
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

  leerGrafico() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateAtG.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtG.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtGs.nativeElement.value.toString().trim();

    this.serviceService.getatenciongrafico(fechaDesde, fechaHasta, cod).subscribe(
      (serviciograf: any) => {
        // VERIFICACION DE ANCHO DE PANTALLA PARA MOSTRAR O NO LABELS
        this.legend = screen.width < 575 ? false : true;
        // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
        this.serviciograf = serviciograf.turnos;
        this.malRequestAtG = false;
        this.malRequestAtGPag = false;
        // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
        if (this.configGS.currentPage > 1) {
          this.configGS.currentPage = 1;
        }
        this.todasSucursalesGS = this.comprobarBusquedaSucursales(cod);
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
    // SI CHART ES VACIO NO PASE NADA, CASO CONTRARIO SI TIENEN YA DATOS, SE DESTRUYA PARA CREAR UNO NUEVO, 
    // EVITANDO SUPERPOSISION DEL NUEVO CHART
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
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
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
    }
    else {
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

    // INSTRUCCIÓN PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
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
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
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
    }
    else {
      for (let step = 0; step < this.serviciopa.length; step++) {
        jsonServicio.push({
          Servicios: this.serviciopa[step].SERV_NOMBRE,
          Fecha: this.serviciopa[step].TURN_FECHA,
          "T. Promedio de Espera": this.serviciopa[step].PromedioEspera,
          "T. Promedio de Atención": this.serviciopa[step].PromedioAtencion,
        });
      }
    }
    // INSTRUCCIÓN PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
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
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
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
    }
    else {
      for (let step = 0; step < this.serviciomax.length; step++) {
        jsonServicio.push({
          Cod: this.serviciomax[step].SERV_CODIGO,
          Servicio: this.serviciomax[step].SERV_NOMBRE,
          Fecha: this.serviciomax[step].Fecha,
          "T. Máximo de Atención": this.serviciomax[step].Maximo,
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
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
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
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
    // MAPEO DE INFORMACION DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio = [];
    for (let step = 0; step < this.serviciograf.length; step++) {
      jsonServicio.push({
        Servicio: this.serviciograf[step].Servicio,
        Atendidos: this.serviciograf[step].Atendidos,
        "No Atendidos": this.serviciograf[step].No_Atendidos,
        Total: this.serviciograf[step].Total,
      });
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
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

  // PDF'S
  generarPdfTiempoComp(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtTC.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtTC.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtTC.nativeElement.value.toString().trim();
    let documentDefinition;
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    if (pdf === 1) {
      documentDefinition = this.getDocumentTiempoCompleto(
        fechaDesde,
        fechaHasta,
        cod
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
  getDocumentTiempoCompleto(fechaDesde: any, fechaHasta: any, cod: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
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
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
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
      // CONTENIDO DEL PDF, LOGO, NOMBRE DEL REPORTE, CON EL RENAGO DE FECHAS DE LOS DATOS
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
    }
    else {
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
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateAtPA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtPA.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtPA.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentPromedioAtencion(
        fechaDesde,
        fechaHasta,
        cod
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
  getDocumentPromedioAtencion(fechaDesde: any, fechaHasta: any, cod: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
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
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtMA.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtMA.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtMA.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentMaxAtencion(fechaDesde, fechaHasta, cod);
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

  getDocumentMaxAtencion(fechaDesde: any, fechaHasta: any, cod: any) {
    // SE OBTIENE LA FECHA ACTUAL
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
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
    }
    else {
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
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.fromDateAtAS.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtAS.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtAS.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionServicio(
        fechaDesde,
        fechaHasta,
        cod
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
  getDocumentAtencionServicio(fechaDesde: any, fechaHasta: any, cod: any) {
    // SE OBTIENE LA FECHA ACTUAL
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
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
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateAtG.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateAtG.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtGs.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
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
  getDocumentAtencionServicioGraf(fechaDesde: any, fechaHasta: any, cod: any) {
    // SELECCIONA DE LA INTERFAZ EL ELEMENTO QUE CONTIENE LA GRAFICA
    var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
    // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
    var canvasImg = canvas1.toDataURL("image/png");

    // SE OBTIENE LA FECHA ACTUAL
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
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
