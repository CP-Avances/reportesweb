import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { Chart } from "chart.js";

import { ServiceService } from "../../services/service.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from "../../services/authentication.service";
import ExcelJS from "exceljs";
import * as FileSaver from 'file-saver';

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { Utils } from "../../utils/util";
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
const EXCEL_EXTENSION = ".xlsx";

@Component({
  selector: "app-opinion",
  templateUrl: "./opinion.component.html",
  styleUrls: ["./opinion.component.scss"],
})

export class OpinionComponent implements OnInit {
  chart: any = '';
  private imagen: any;

  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("fechaDesde") fechaDesde: ElementRef;
  @ViewChild("fechaHasta") fechaHasta: ElementRef;
  @ViewChild("horaInicio") horaInicio: ElementRef;
  @ViewChild("horaFin") horaFin: ElementRef;

  @ViewChild("fechaDesdeG") fechaDesdeG: ElementRef;
  @ViewChild("fechaHastaG") fechaHastaG: ElementRef;
  @ViewChild("horaInicioG") horaInicioG: ElementRef;
  @ViewChild("horaFinG") horaFinG: ElementRef;


  private bordeCompleto!: Partial<ExcelJS.Borders>;
  private fontTitulo!: Partial<ExcelJS.Font>;

  // VARIABLES DE LA GRAFICA
  chartPie: any;
  chartBar: any;
  tipo: string;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioOpinionIC: any = [];
  servicioocg: any = [];
  categorias: any[];
  sucursales: any[];
  servicio: any;

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any = '#0077b6';

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursales: boolean = false;
  todosTipos: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestAtM: boolean = false;
  malRequestICPag: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;
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
  marca: string = "";
  horas: number[] = [];

  constructor(
    private imagenesService: ImagenesService,
    private serviceService: ServiceService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
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
    this.malRequestICPag = true;
    // CARGAR LOGO PARA LOS REPORTES
    this.imagenesService.cargarImagen().then((result: any) => {
      this.urlImagen = result;
    }).catch((error) => {
      Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
        (result) => (this.urlImagen = result)
      );
    });

    this.bordeCompleto = {
      top: { style: "thin" as ExcelJS.BorderStyle },
      left: { style: "thin" as ExcelJS.BorderStyle },
      bottom: { style: "thin" as ExcelJS.BorderStyle },
      right: { style: "thin" as ExcelJS.BorderStyle },
    };

    this.fontTitulo = { bold: true, size: 12, color: { argb: "FFFFFF" } };

  }

  selectAll(opcion: string) {
    switch (opcion) {
      case 'todasSucursales':
        this.todasSucursales = !this.todasSucursales;
        if (!this.todasSucursales) {
          if (this.sucursalesSeleccionadas.length == 0) {
            this.servicioOpinionIC = [];
            this.malRequestICPag = true;
            this.servicioocg = false;
            this.malRequestAtM = true;
          }
        }
        break;
      case 'todosTipos':
        this.todosTipos = !this.todosTipos;
        this.servicioOpinionIC = [];
        this.malRequestICPag = true;
        break;
      case 'sucursalesSeleccionadas':
        this.sucursalesSeleccionadas.length > 1
          ? this.seleccionMultiple = true
          : this.seleccionMultiple = false;
        if (this.sucursalesSeleccionadas.length == 0) {
          this.servicioOpinionIC = [];
          this.malRequestICPag = true;
          this.servicioocg = false;
          this.malRequestAtM = true;
        }
        break;
      case 'seleccionarTipos':
        this.servicioOpinionIC = [];
        this.malRequestICPag = true;
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

  limpiar() {
    this.getSucursales();
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
    this.servicioOpinionIC = [];
    this.malRequestICPag = true;
    this.tiposSeleccionados = [];
    this.todosTipos = false;
    this.todasSucursales = false;
    this.servicioocg = false;
    this.malRequestAtM = true;
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  obtenerNombreSucursal(sucursales: any) {
    const listaSucursales = sucursales;
    let nombreSucursal = "";

    listaSucursales.forEach((elemento: any) => {
      const cod = elemento;
      if (cod == "-1") {
        nombreSucursal = "GENERAL";
        return;
      }
      const nombre = this.sucursales.find(
        (sucursal) => sucursal.empr_codigo == cod
      ).empr_nombre;
      nombreSucursal += `${nombre} `;
    });
    return nombreSucursal;
  }

  // FUNCION PARA SUMAR UN DIA A LA FECHA
  addOneDay(date: Date): Date {
    date.setDate(date.getDate() + 1);
    return date;
  }


  /** **************************************************************************************** **
   ** **                         INFORME GENERAL DE SATISFACCION                            ** **
   ** **************************************************************************************** **/

  LeerOpiniones() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fechaDesde.nativeElement.value.toString().trim();
    var fH = this.fechaHasta.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicio.nativeElement.value;
    let horaFin = this.horaFin.nativeElement.value;

    if (this.sucursalesSeleccionadas.length != 0 && this.tiposSeleccionados.length != 0) {
      this.serviceService.getopinionesIC(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas, this.tiposSeleccionados).subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioOpinionIC = servicio.turnos;
          this.servicioOpinionIC.forEach((dato: any) => {
            if (dato.caja_caja_nombre === '0') {
              dato.caja_caja_nombre = ' ';
            }
          })
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
    else {
      this.toastr.info("No ha seleccionado datos de búsqueda.", "Upss !!!.", {
        timeOut: 6000,
      });
    }
  }

  GenerarPDFOpiniones(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fechaDesde.nativeElement.value.toString().trim();
    var fH = this.fechaHasta.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.EstructuraOpiniones(fD, fH);
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
  EstructuraOpiniones(desde: any, hasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    return {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 40],
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3, alignment: 'right' },

      footer: function (currentPage: any, pageCount: any, fecha: any, timer: any) {
        fecha = f.toJSON().split("T")[0];
        timer = f.toJSON().split("T")[1].slice(0, 5);
        return {
          margin: 10,
          columns: [
            { text: 'Fecha: ' + fecha + ' Hora: ' + timer, opacity: 0.3 },
            {
              text: [
                {
                  text: '© Pag ' + currentPage.toString() + ' de ' + pageCount,
                  alignment: 'right', opacity: 0.3
                }
              ],
            }
          ],
          fontSize: 10
        }
      },
      content: [
        { image: this.urlImagen, width: 100, margin: [10, -25, 0, 5] },
        { text: `REPORTE MÓDULO DE SATISFACCIÓN`, bold: true, fontSize: 14, alignment: 'center', margin: [0, -30, 0, 5] },
        { text: nombreSucursal?.toUpperCase(), bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        { text: `PERIODO DEL ${desde} HASTA ${hasta}`, bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        this.ListarOpiniones(this.servicioOpinionIC), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF      
      ],
      styles: {
        tableHeader: { fontSize: 8, bold: true, alignment: 'center', fillColor: this.p_color },
        principal: { fontSize: 8, bold: true, alignment: 'center', fillColor: "#aafdc3" },
        itemsTable: { fontSize: 8 },
        tableMargin: { margin: [0, 0, 0, 0] },
      },
    };
  }

  ListarOpiniones(servicio: any[]) {
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
            { text: "Observación", style: "tableHeader" },
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
  }

  async exportTOExcelSatisfaccion() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Informe Opiniones");
    this.imagen = workbook.addImage({
      base64: this.urlImagen,
      extension: "png",
    });
    worksheet.addImage(this.imagen, {
      tl: { col: 0, row: 0 },
      ext: { width: 220, height: 105 },
    });
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // COMBINAR CELDAS
    worksheet.mergeCells("B1:H1");
    worksheet.mergeCells("B2:H2");
    worksheet.mergeCells("B3:H3");
    worksheet.mergeCells("B4:H4");
    worksheet.mergeCells("B5:H5");
    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'REPORTE MÓDULO DE SATISFACCIÓN'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fechaDesde.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.fechaHasta.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "PERIODO DE " + fechaDesde + " HASTA " + fechaHasta;
    // APLICAR ESTILO DE CENTRADO Y NEGRITA A LAS CELDAS COMBINADAS
    ["B1", "B2", "B3"].forEach((cell) => {
      worksheet.getCell(cell).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(cell).font = { bold: true, size: 14 };
    });

    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let step = 0; step < this.servicioOpinionIC.length; step++) {
      jsonServicio.push([
        this.servicioOpinionIC[step].empresa_empr_nombre,
        this.servicioOpinionIC[step].quejas_emi_tipo,
        this.servicioOpinionIC[step].quejas_emi_categoria,
        this.addOneDay(new Date(this.servicioOpinionIC[step].quejas_emi_fecha)),
        this.servicioOpinionIC[step].hora,
        this.servicioOpinionIC[step].caja_caja_nombre,
        this.servicioOpinionIC[step].quejas_emi_queja,
      ]
      );
    }
    worksheet.columns = [
      { key: "sucu", width: 30 },
      { key: "tip", width: 25 },
      { key: "cate", width: 25 },
      { key: "fec", width: 20 },
      { key: "hor", width: 20 },
      { key: "caj", width: 50 },
      { key: "opi", width: 50 },
    ]
    let columnas = []
    columnas = [
      { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
      { name: "TIPO", totalsRowLabel: "", filterButton: true },
      { name: "CATEGORIA", totalsRowLabel: "", filterButton: true },
      { name: "FECHA", totalsRowLabel: "", filterButton: true },
      { name: "HORA", totalsRowLabel: "", filterButton: true },
      { name: "CAJA", totalsRowLabel: "", filterButton: true },
      { name: "OBSERVACION", totalsRowLabel: "", filterButton: true },
    ]

    worksheet.addTable({
      name: "opiniones",
      ref: "A6",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium16",
        showRowStripes: true,
      },
      columns: columnas,
      rows: jsonServicio,
    });
    const numeroFilas = jsonServicio.length;
    for (let i = 0; i <= numeroFilas; i++) {
      for (let j = 1; j <= 7; j++) {
        const cell = worksheet.getRow(i + 6).getCell(j);
        if (i === 0) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: this.obtenerAlineacionHorizontal(j),
          };
        }
        cell.border = this.bordeCompleto;
      }
    }
    worksheet.getRow(6).font = this.fontTitulo;
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, "informeOpinionesExcel - " + nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }
  }

  private obtenerAlineacionHorizontal(
    j: number
  ): "left" | "center" | "right" {
    if (j === 1 || j === 9 || j === 10 || j === 11) {
      return "center";
    } else {
      return "left";
    }
  }


  /** **************************************************************************************** **
   ** **                         INFORME GRAFICO DE SATISFACCION                            ** **
   ** **************************************************************************************** **/

  LeerGraficoOpiniones() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fechaDesdeG.nativeElement.value.toString().trim();
    var fH = this.fechaHastaG.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioG.nativeElement.value;
    let horaFin = this.horaFinG.nativeElement.value;

    this.malRequestAtM = false;

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getgraficoopinion(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe(
        (servicioocg: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioocg = servicioocg.turnos;
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioocg = null;
            this.malRequestAtM = true;
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
    else {
      this.toastr.info("No ha seleccionado datos.", "Upss !!!.", {
        timeOut: 6000,
      });
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

  generarPdfOpiniones(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fechaDesde.nativeElement.value.toString().trim();
    var fH = this.fechaHasta.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 2) {
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
      pageSize: 'A4',
      pageOrientation: this.orientacion,
      pageMargins: [40, 60, 40, 40],
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3, alignment: 'right' },

      footer: function (currentPage: any, pageCount: any, fecha: any, timer: any) {
        fecha = f.toJSON().split("T")[0];
        timer = f.toJSON().split("T")[1].slice(0, 5);
        return {
          margin: 10,
          columns: [
            { text: 'Fecha: ' + fecha + ' Hora: ' + timer, opacity: 0.3 },
            {
              text: [
                {
                  text: '© Pag ' + currentPage.toString() + ' de ' + pageCount,
                  alignment: 'right', opacity: 0.3
                }
              ],
            }
          ],
          fontSize: 10
        }
      },
      content: [
        { image: this.urlImagen, width: 100, margin: [10, -25, 0, 5] },
        { text: `REPORTE DEL MÓDULO DE SATISFACCIÓN`, bold: true, fontSize: 14, alignment: 'center', margin: [0, -30, 0, 5] },
        { text: nombreSucursal?.toUpperCase(), bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        { text: `PERIODO DEL ${fD} HASTA ${fH}`, bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        this.opinionesGraficos(this.servicioocg),
        this.grafico(canvasImg),
        this.grafico(canvasImg1), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableHeader: { fontSize: 8, bold: true, alignment: 'center', fillColor: this.p_color },
        principal: { fontSize: 8, bold: true, alignment: 'center', fillColor: "#aafdc3" },
        itemsTable: { fontSize: 8 },
        tableMargin: { margin: [0, 0, 0, 0] },
      },
    };
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF la estructura
  opinionesGraficos(servicio: any[]) {
    return {
      style: "tableMargin",
      table: {
        alignment: "center",
        headerRows: 1,
        widths: ["*", "*", "*"],
        body: [
          [
            { text: "SUCURSAL", style: "tableHeader" },
            { text: "TIPO", style: "tableHeader" },
            { text: "CANTIDAD", style: "tableHeader" },
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

  async exportTOExcelOpinionesGrafico() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Informe General");
    this.imagen = workbook.addImage({
      base64: this.urlImagen,
      extension: "png",
    });

    worksheet.addImage(this.imagen, {
      tl: { col: 0, row: 0 },
      ext: { width: 220, height: 105 },
    });

    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // COMBINAR CELDAS
    worksheet.mergeCells("B1:H1");
    worksheet.mergeCells("B2:H2");
    worksheet.mergeCells("B3:H3");
    worksheet.mergeCells("B4:H4");
    worksheet.mergeCells("B5:H5");
    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'REPORTE DEL MÓDULO DE SATISFACCIÓN'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fechaDesdeG.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.fechaHastaG.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "PERIODO DE " + fechaDesde + " HASTA " + fechaHasta;

    // APLICAR ESTILO DE CENTRADO Y NEGRITA A LAS CELDAS COMBINADAS
    ["B1", "B2", "B3"].forEach((cell) => {
      worksheet.getCell(cell).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(cell).font = { bold: true, size: 14 };
    });

    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let step = 0; step < this.servicioocg.length; step++) {
      jsonServicio.push([
        this.servicioocg[step].empresa_empr_nombre,
        this.servicioocg[step].quejas_emi_tipo,
        this.servicioocg[step].queja_cantidad,
      ])
    }
    worksheet.columns = [
      { key: "suc", width: 50 },
      { key: "tip", width: 50 },
      { key: "canti", width: 20 },
    ]

    let columnas = []
    columnas = [
      { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
      { name: "TIPO", totalsRowLabel: "", filterButton: true },
      { name: "CANTIDAD", totalsRowLabel: "", filterButton: true },
    ]
    worksheet.addTable({
      name: "opiniones",
      ref: "A6",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium16",
        showRowStripes: true,
      },
      columns: columnas,
      rows: jsonServicio,
    });
    const numeroFilas = jsonServicio.length;
    for (let i = 0; i <= numeroFilas; i++) {
      for (let j = 1; j <= 3; j++) {
        const cell = worksheet.getRow(i + 6).getCell(j);
        if (i === 0) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else {
          cell.alignment = {
            vertical: "middle",
            horizontal: this.obtenerAlineacionHorizontal(j),
          };
        }
        cell.border = this.bordeCompleto;
      }
    }
    worksheet.getRow(6).font = this.fontTitulo;
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, "informeOpinionesExcel - " + nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }

  }

}
