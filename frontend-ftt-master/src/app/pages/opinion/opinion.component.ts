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
import { servicio } from '../../models/servicio';
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
  @ViewChild("fromDateOcupG") fromDateOcupG: ElementRef;
  @ViewChild("toDateOcupG") toDateOcupG: ElementRef;
  @ViewChild('codSucursalAtM') codSucursalAtM: ElementRef;
  @ViewChild('codSucursalOcupG') codSucursalOcupG: ElementRef;

  //Variables de la grafica
  chartPie: any;
  chartBar: any;
  tipo: string;

  //Servicios-Variables donde se almacenaran las consultas a la BD
  servicioOpinion: any = [];
  servicioocg: any = [];
  sucursales: any[];
  servicio: any;

  //Variable usada en exportacion a excel
  p_color: any;

  //Banderas para mostrar la tabla correspondiente a las consultas
  todasSucursalesI: boolean = false;
  todasSucursalesG: boolean = false;

  //Banderas para que no se quede en pantalla consultas anteriores
  malRequestAtM: boolean = false;
  malRequestAtMPag: boolean = false;
  malRequestOcupG: boolean = false;

  //Usuario que ingreso al sistema
  userDisplayName: any;

  //Control paginacion
  configAtM: any;
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
  seleccionMultiple: boolean = false;

   //Orientacion
  orientacion: string;

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
  }

  //Eventos para avanzar o retroceder en la paginacion
  pageChangedAtM(event) {
    this.configAtM.currentPage = event;
  }

  ngOnInit(): void {
    //Cargamos tipo de grafico
    this.tipo = "pie";
    //seteo orientacion
    this.orientacion = "portrait";
    //Cargamos componentes selects HTML
    this.getlastday();
    this.getSucursales();
    //Cargamos nombre de usuario logueado
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    //Seteo de banderas cuando el resultado de la peticion HTTP no es 200 OK
    this.malRequestAtMPag = true;
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
        case 'todasSucursalesES':
            this.todasSucursalesG = !this.todasSucursalesG;
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

  limpiar() {
    this.getSucursales();
    this.todasSucursalesI = false;
    this.todasSucursalesG = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  //Comprueba si se realizo una busqueda por sucursales
  comprobarBusquedaSucursales(cod: string){
    return cod=="-1" ? true : false;
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
    // var cod = this.codSucursalAtM.nativeElement.value.toString();

    this.serviceService.getopiniones(fD, fH, this.sucursalesSeleccionadas).subscribe(
      (servicio: any) => {
        //Si se consulta correctamente se guarda en variable y setea banderas de tablas
        this.servicioOpinion = servicio.turnos;
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

  leerGrafOpinion() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateOcupG.nativeElement.value.toString().trim();
    var fH = this.toDateOcupG.nativeElement.value.toString().trim();
    // var cod = this.codSucursalOcupG.nativeElement.value.toString();
    this.malRequestAtM = false;

    this.serviceService.getgraficoopinion(fD, fH, this.sucursalesSeleccionadas).subscribe(
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

    this.serviceService.getgraficoopinion(fD, fH, this.sucursalesSeleccionadas).subscribe(
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
          //Por error 400 se vacia variable de consulta
          this.servicio = null;
        }
      }
    );
    //Si chart es vacio no pase nada, caso contrario si tienen ya datos, se destruya para crear uno nuevo, evitando superposision del nuevo chart
    if (this.chartPie != undefined || this.chartPie != null) {
      this.chartPie.destroy();
    }
    if (this.chartBar != undefined || this.chartBar != null) {
      this.chartBar.destroy();
    }
  }

  obtenerNombreSucursal(cod: string){
    if (cod=="-1") {
      return "Todas las sucursales"
    } else {
      let nombreSucursal = (this.sucursales.find(sucursal => sucursal.empr_codigo == cod)).empr_nombre;
      return nombreSucursal;
    }
  }

  //---Excel
  exportTOExcelOpiniones() {
    let cod = this.codSucursalAtM.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
      if (this.todasSucursalesI) {
        for (let step = 0; step < this.servicioOpinion.length; step++) {
          jsonServicio.push({
            Sucursal: this.servicioOpinion[step].empresa_empr_nombre,
            Tipo: this.servicioOpinion[step].quejas_emi_tipo,
            Categoría: this.servicioOpinion[step].quejas_emi_categoria,
            Fecha: this.servicioOpinion[step].quejas_emi_fecha,
            Hora: this.servicioOpinion[step].quejas_emi_hora + ':' + this.servicioOpinion[step].quejas_emi_minuto,
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
            Hora: this.servicioOpinion[step].quejas_emi_hora + ':' + this.servicioOpinion[step].quejas_emi_minuto,
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
      "informeOpinionesExcel - "+nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  exportTOExcelOpinionesGrafico() {
    let cod = this.codSucursalOcupG.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
      if (this.todasSucursalesG) {
        for (let step = 0; step < this.servicioOpinion.length; step++) {
          jsonServicio.push({
            Sucursal: this.servicioOpinion[step].empresa_empr_nombre,
            Tipo: this.servicioOpinion[step].quejas_emi_tipo,
            Categoría: this.servicioOpinion[step].quejas_emi_categoria,
            Fecha: this.servicioOpinion[step].quejas_emi_fecha,
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
      "informeOpinionesExcel - "+nombreSucursal +
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
      var cod = this.codSucursalAtM.nativeElement.value.toString().trim();
      documentDefinition = this.getDocumentOpiniones(fD, fH, cod);
    } else if (pdf === 2) {
      var cod = this.codSucursalOcupG.nativeElement.value.toString().trim();
      documentDefinition = this.getDocumentOpinionesGraficos(fD, fH, cod);
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
  getDocumentOpiniones(fD, fH, cod) {
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
        tableMargin: { margin: [80,5,80,40], alignment: "center" },
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
  getDocumentOpinionesGraficos(fD, fH, cod) {
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
    if (this.todasSucursalesI) {
      return {
        style: "tableMargin",
        table: {
          alignment: "center",
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto", "auto", "*"],
  
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoría", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Caja", style: "tableHeader" },
              { text: "Opinión", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.empresa_empr_nombre },
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.quejas_emi_fecha },
                { style: "itemsTable", text: res.caja_caja_nombre },
                { style: "itemsTable",alignment: "left", text: res.quejas_emi_queja },
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
          widths: ["auto", "auto", "auto", "auto", "*"],
  
          body: [
            [
              { text: "Tipo", style: "tableHeader" },
              { text: "Categoría", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Caja", style: "tableHeader" },
              { text: "Opinión", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.quejas_emi_tipo },
                { style: "itemsTable", text: res.quejas_emi_categoria },
                { style: "itemsTable", text: res.quejas_emi_fecha },
                { style: "itemsTable", text: res.caja_caja_nombre },
                { style: "itemsTable",alignment: "left", text: res.quejas_emi_queja },
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
    if (this.todasSucursalesG) {
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
}
