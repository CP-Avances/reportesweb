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
  selector: "app-ocupacion",
  templateUrl: "./ocupacion.component.html",
  styleUrls: ["./ocupacion.component.scss"],
})

export class OcupacionComponent implements OnInit {
  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;
  chart: any = '';

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("fromDateOcupOS") fromDateOcupOS: ElementRef;
  @ViewChild("toDateOcupOS") toDateOcupOS: ElementRef;
  @ViewChild("fromDateOcupG") fromDateOcupG: ElementRef;
  @ViewChild("toDateOcupG") toDateOcupG: ElementRef;
  @ViewChild("codSucursalOCs") codSucursalOCs: ElementRef;
  @ViewChild("codSucursalOCsG") codSucursalOCsG: ElementRef;

  @ViewChild("horaInicioOS") horaInicioOS: ElementRef;
  @ViewChild("horaFinOS") horaFinOS: ElementRef;
  @ViewChild("horaInicioOG") horaInicioOG: ElementRef;
  @ViewChild("horaFinOG") horaFinOG: ElementRef;

  // VARIABLES DE LA GRAFICA
  chartPie: any;
  chartBar: any;
  tipo: string;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicio: any;
  serviciooc: any = [];
  servicioocg: any = [];
  sucursales: any = [];

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesO: boolean = false;
  todasSucursalesOG: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestOcupOS: boolean = false;
  malRequestOcupOSPag: boolean = false;
  malRequestOcupG: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configOS: any;
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
  seleccionMultiple: boolean = false;

  // ORIENTACION
  orientacion: string;

  // TOTALES
  porcentajeTotal: number;
  turnosTotal: number;
  mostrarTotal: boolean = false;

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
    this.configOS = {
      id: "Ocupos",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.serviciooc.length,
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }

  }
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedOS(event: any) {
    this.configOS.currentPage = event;
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
    this.malRequestOcupOSPag = true;
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
        case 'todasSucursalesO':
            this.todasSucursalesO = !this.todasSucursalesO;
            break;
        case 'todasSucursalesOG':
            this.todasSucursalesOG = !this.todasSucursalesOG;
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

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // SE OBTIENE LA FECHA ACTUAL
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

  limpiar() {
    this.getSucursales();
    this.todasSucursalesO = false;
    this.todasSucursalesOG = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string){
    return cod=="-1" ? true : false;
  }

  leerOcupacion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateOcupOS.nativeElement.value.toString().trim();
    var fH = this.toDateOcupOS.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioOS.nativeElement.value;
    let horaFin = this.horaFinOS.nativeElement.value;

    if (this.sucursalesSeleccionadas.length!==0) {
      this.serviceService.getocupacionservicios(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (serviciooc: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.serviciooc = serviciooc.turnos;
          this.malRequestOcupOS = false;
          this.malRequestOcupOSPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configOS.currentPage > 1) {
            this.configOS.currentPage = 1;
          }
          let totalT = serviciooc.turnos.map((res) => res.total);
          let totalP = serviciooc.turnos.map((res) => res.PORCENTAJE);
          let totalTurnos: number = 0;
          let totalPorc: number = 0;
          for (var i = 0; i < totalT.length; i++) {
            totalTurnos = totalTurnos + Number(totalT[i]);
            totalPorc = totalPorc + Number(totalP[i]);
          }
          this.turnosTotal = totalTurnos;
          this.porcentajeTotal = Math.round(totalPorc);
          this.mostrarTotal = true;
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.serviciooc = null;
            this.malRequestOcupOS = true;
            this.malRequestOcupOSPag = true;
            this.mostrarTotal = false;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS 
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/ 
            if (this.serviciooc == null) {
              this.configOS.totalItems = 0;
            } else {
              this.configOS.totalItems = this.serviciooc.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configOS = {
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

  leerGrafOcupacion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateOcupG.nativeElement.value.toString().trim();
    var fH = this.toDateOcupG.nativeElement.value.toString().trim();
   
    let horaInicio = this.horaInicioOG.nativeElement.value;
    let horaFin = this.horaFinOG.nativeElement.value;

    this.malRequestOcupOS = false;

    if (this.sucursalesSeleccionadas.length!==0) {
      this.serviceService.getocupacionservicios(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicioocg: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioocg = servicioocg.turnos;
          // this.malRequestOcupOS = false;
          this.malRequestOcupOSPag = false;
          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configOS.currentPage > 1) {
            this.configOS.currentPage = 1;
          }
          let totalT = servicioocg.turnos.map((res) => res.total);
          let totalP = servicioocg.turnos.map((res) => res.PORCENTAJE);
          let totalTurnos = 0;
          let totalPorc = 0;
          for (var i = 0; i < totalT.length; i++) {
            totalTurnos = totalTurnos + totalT[i];
            totalPorc = totalPorc + totalP[i];
          }
          this.turnosTotal = totalTurnos;
          this.porcentajeTotal = Math.round(totalPorc);
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioocg = null;
            this.malRequestOcupOS = true;
            this.malRequestOcupOSPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS 
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/ 
            if (this.servicioocg == null) {
              this.configOS.totalItems = 0;
            } else {
              this.configOS.totalItems = this.servicioocg.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configOS = {
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
      this.serviceService.getgraficoocupacion(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          // SE VERIFICA EL ANCHO DE PANTALLA PARA COLOCAR O NO LABELS
          this.legend = screen.width < 575 ? false : true;
          // MAPEO DE PORCENTAJES PARA MOSTRAR EN PANTALLA
          this.servicio = servicio.turnos;
          let total = servicio.turnos.map((res: any) => res.total);
          let servicios = servicio.turnos.map((res: any) => res.SERV_NOMBRE);
          let codigo = servicio.turnos.map((res: any) => res.SERV_CODIGO);
          let Nombres: any = [];
          let totalPorc = 0;
          for (var i = 0; i < servicios.length; i++) {
            totalPorc = totalPorc + total[i];
          }
          for (var i = 0; i < servicios.length; i++) {
            Nombres.push(
              servicios[i] +
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
                /*xAxes: [
                  {
                    ticks: {
                      display: this.legend,
                    },
                  },
                ],*/
              },
              plugins:{
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

  // EXCEL
  exportarAExcelOcupServs() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesO || this.seleccionMultiple) {
      for (let step = 0; step < this.serviciooc.length; step++) {
        jsonServicio.push({
          Sucursal: this.serviciooc[step].nombreEmpresa,
          Desde: new Date(this.serviciooc[step].fechaminima),
          Hasta: new Date(this.serviciooc[step].fechamaxima),
          Servicio: this.serviciooc[step].SERV_NOMBRE,
          "T. Turno": this.serviciooc[step].total,
          "Porcentaje de ocupación": this.serviciooc[step].PORCENTAJE+ "%",
        });
      }
    } else {
      for (let step = 0; step < this.serviciooc.length; step++) {
        jsonServicio.push({
          Desde: new Date(this.serviciooc[step].fechaminima),
          Hasta: new Date(this.serviciooc[step].fechamaxima),
          Servicio: this.serviciooc[step].SERV_NOMBRE,
          "T. Turno": this.serviciooc[step].total,
          "Porcentaje de ocupación": this.serviciooc[step].PORCENTAJE+ "%",
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.serviciooc[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    XLSX.writeFile(
      wb,
      "ocupacionservicios - "+ nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  exportarAExcelOcupServsGrafico() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursalesOG || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioocg.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioocg[step].nombreEmpresa,
          Desde: new Date(this.servicioocg[step].fechaminima),
          Hasta: new Date(this.servicioocg[step].fechamaxima),
          Servicio: this.servicioocg[step].SERV_NOMBRE,
          "T. Turno": this.servicioocg[step].total,
          "Porcentaje Ocupación": this.servicioocg[step].PORCENTAJE + "%",
        });
      }
    } else {
      for (let step = 0; step < this.servicioocg.length; step++) {
        jsonServicio.push({
          Desde: new Date(this.servicioocg[step].fechaminima),
          Hasta: new Date(this.servicioocg[step].fechamaxima),
          Servicio: this.servicioocg[step].SERV_NOMBRE,
          "T. Turno": this.servicioocg[step].total,
          "Porcentaje Ocupación": this.servicioocg[step].PORCENTAJE + "%",
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
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    XLSX.writeFile(
      wb,
      "ocupacionserviciosGrafico - "+ nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  getDocumentAtencionServicioGraficos(fD, fH) {
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
              text: "Reporte - Ocupación",
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
        this.ocupacionGrafica(this.servicioocg),
        {
          style: "subtitulos",
          text: "TOTAL: Turnos " + this.turnosTotal + ", Porcentaje de ocupación " + this.porcentajeTotal + " %",
        },
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

  generarPdfOcupServs(action = "open", pdf: number) {
     // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fromDateOcupOS.nativeElement.value.toString().trim();
    var fH = this.toDateOcupOS.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionServicioGraf(fD, fH);
    } else if (pdf === 2) {
      documentDefinition = this.getDocumentAtencionServicioGraficos(fD, fH);
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
  getDocumentAtencionServicioGraf(fD, fH) {
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
              text: "Reporte - Ocupación",
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
        this.ocupacion(this.serviciooc),

        {
          style: "subtitulos",
          text: "TOTAL: Turnos " + this.turnosTotal + ", Porcentaje de ocupación " + this.porcentajeTotal + " %",
        },
         // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF la estructura
  ocupacion(servicio: any[]) {
    if (this.todasSucursalesO || this.seleccionMultiple) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto","auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Desde", style: "tableHeader" },
              { text: "Hasta", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "T. Turno", style: "tableHeader" },
              { text: "Porcentaje Ocupacion", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.fechaminima },
                { style: "itemsTable", text: res.fechamaxima },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.total },
                { style: "itemsTable", text: res.PORCENTAJE + " %" },
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
          widths: ["*", "*", "*", "*", "*"],
          body: [
            [
              { text: "Desde", style: "tableHeader" },
              { text: "Hasta", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "T. Turno", style: "tableHeader" },
              { text: "Porcentaje Ocupacion", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.fechaminima },
                { style: "itemsTable", text: res.fechamaxima },
                { style: "itemsTable", text: res.SERV_NOMBRE },
                { style: "itemsTable", text: res.total },
                { style: "itemsTable", text: res.PORCENTAJE + " %"},
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
    ocupacionGrafica(servicio: any[]) {
      if (this.todasSucursalesOG || this.seleccionMultiple) {
        return {
          style: "tableMargin",
          table: {
            headerRows: 1,
            widths: ["*", "auto", "auto", "auto", "auto","auto"],
            body: [
              [
                { text: "Sucursal", style: "tableHeader" },
                { text: "Desde", style: "tableHeader" },
                { text: "Hasta", style: "tableHeader" },
                { text: "Servicio", style: "tableHeader" },
                { text: "T. Turno", style: "tableHeader" },
                { text: "Porcentaje Ocupacion", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.nombreEmpresa },
                  { style: "itemsTable", text: res.fechaminima },
                  { style: "itemsTable", text: res.fechamaxima },
                  { style: "itemsTable", text: res.SERV_NOMBRE },
                  { style: "itemsTable", text: res.total },
                  { style: "itemsTable", text: res.PORCENTAJE + " %"},
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
            widths: ["*", "*", "*", "*", "*"],
            body: [
              [
                { text: "Desde", style: "tableHeader" },
                { text: "Hasta", style: "tableHeader" },
                { text: "Servicio", style: "tableHeader" },
                { text: "T. Turno", style: "tableHeader" },
                { text: "Porcentaje Ocupacion", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.fechaminima },
                  { style: "itemsTable", text: res.fechamaxima },
                  { style: "itemsTable", text: res.SERV_NOMBRE },
                  { style: "itemsTable", text: res.total },
                  { style: "itemsTable", text: res.PORCENTAJE + " %" },
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
