import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
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

  // ARRAY DE DATOS VACIO
  arrayVacio: any[] = [];

  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // VARIABLES DE LAS CONSULTAS DE RESUMEN DE EVALUACIONES
  @ViewChild("desdeRE") desdeRE: ElementRef;
  @ViewChild("hastaRE") hastaRE: ElementRef;
  @ViewChild("horaInicioRE") horaInicioRE: ElementRef;
  @ViewChild("horaFinRE") horaFinRE: ElementRef;
  @ViewChild("contentResumenE") contentResumenE: ElementRef;
  @ViewChild("tableResumenE", { static: false }) tableResumenE: ElementRef;

  // VARIABLES DE LAS CONSULTAS DE EVALUACIONES POR TURNO
  @ViewChild("desdeEvalT") desdeEvalT: ElementRef;
  @ViewChild("hastaEvalT") hastaEvalT: ElementRef;
  @ViewChild("horaInicioET") horaInicioET: ElementRef;
  @ViewChild("horaFinET") horaFinET: ElementRef;
  @ViewChild("contentEvalT") contentEvalT: ElementRef;
  @ViewChild("tableEvalT", { static: false }) tableEvalT: ElementRef;

  // CAMBIO DE TIPO DE GRAFICO Y VARIABLE PARA GUARDAR EL USUARIO LOGUEADo
  tipo: string;
  chart: any;
  userDisplayName: any;

  // PARAMETROS DE REPORTES
  p_color: any;
  urlImagen: string;

  // VARIABLES DE OPCIONES DE BOTONES
  opciones: any[];
  opcionCuatro: boolean = false;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  listaEvaluaciones: any = [];
  listaServicios: any = [];
  resumenEvaluacion: any = [];
  subservicios: any = [];
  cajerosEval: any = [];
  sucursales: any[];




  servicioGra: any = [];



  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursales: boolean = false;
  todosServicios: boolean = false;
  todosSubservicios: boolean = false;
  todosCajeros: boolean = false;

  todasSucursalesS: boolean = false;
  todasSucursalesG: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestS: boolean = false;
  malRequestSPag: boolean = false;
  malRequestE: boolean = false;
  malRequestEPag: boolean = false;

  malRequestGra: boolean = false;
  malRequestGraPag: boolean = false;

  // CONTROL PAGINACION
  configS: any;
  configE: any;

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

  // OPCIONES MULTIPLES

  selectedItems: string[] = [];
  sucursalesSeleccionadas: string[] = [];
  cajerosSeleccionados: string[] = [];
  serviciosSeleccionados: string[] = [];
  seleccionMultiple: boolean = false;

  // MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  // MOSTRAR SERVICIOS
  mostrarServicios: boolean = false;

  // MOSTRAR SUBSERVCIOS
  mostrarSubservicios: boolean = false;

  // ORIENTACION
  orientacion: string;

  // VARIABLES PARA VER DATOS
  verServicio: boolean = false;
  verSubservicio: boolean = false;
  verCajero: boolean = false;

  // INFORMACION
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  constructor(
    private imagenesService: ImagenesService,
    private detectarCambios: ChangeDetectorRef,
    private serviceService: ServiceService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
  ) {
    // HORAS DE SELECTORES
    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }

    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configS = {
      id: "Evals",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.resumenEvaluacion.length,
    };
    this.configE = {
      id: "Evale",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.listaEvaluaciones.length,
    };
  }

  ngOnInit(): void {
    this.ObtenerOpcionesEvaluacion();
    this.ObtenerFechaActual();
    this.ObtenerSucursales();
    this.getMarca();
    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");
    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestSPag = true;
    this.malRequestEPag = true;
    this.malRequestGraPag = true;
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

  // SE OBTIENE FECHA ACTUAL
  ObtenerFechaActual() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  // OBTINENE EL NUMERO DE OPCIONES DE EVALUACION
  verSiglas: string = '';
  verCliente: string = '';
  ObtenerOpcionesEvaluacion() {
    this.serviceService.getOpcionesEvaluacion().subscribe((opcion: any) => {
      this.opciones = opcion.opcion;
      this.opciones.forEach((valor: any) => {
        if (valor.gene_codigo === 7) {
          if (valor.gene_valor == "0") {
            this.opcionCuatro = true;
          }
        }
        if (valor.gene_codigo === 11) {
          this.verCliente = valor.gene_valor;
        }
        if (valor.gene_codigo === 12) {
          this.verSiglas = valor.gene_valor;
        }
      })
    });
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES
  ObtenerSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  // CONSULTA DE MARCA DE AGUA DE REPORTES
  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // CONSULTA PARA OBTENER CAJEROS
  getCajeros(sucursal: any) {
    this.serviceService.getCajerosSucursalEstado(sucursal, this.estadoUsuario).subscribe((cajeros: any) => {
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

  // OBTIENE LOS SERVICIOS QUE EXISTEN
  getServicios(sucursal: any) {
    console.log('ver ', sucursal)
    this.serviceService.getAllServiciosS(sucursal).subscribe((servicios: any) => {
      this.listaServicios = servicios.servicios.filter(
        (valor: any, indice: any, self: any) =>
          self.findIndex((v: any) => v.serv_codigo === valor.serv_codigo) === indice
      );
      this.mostrarServicios = true;
    },
      (error) => {
        if (error.status == 400) {
          this.listaServicios = [];
          this.mostrarServicios = false;
        }
      });
  }

  // OBTIENE LOS SUBSERVICIOS QUE EXISTEN
  getSubservicios(servicio: any) {
    this.serviceService.getAllSubservicios(servicio).subscribe((subservicios: any) => {
      this.subservicios = subservicios.servicios;
      this.mostrarSubservicios = true;
    },
      (error) => {
        if (error.status == 400) {
          this.listaServicios = [];
          this.mostrarSubservicios = false;
        }
      });
  }

  // METODO DE CONTROL DE SELECCION DE FILTROS
  selectAll(opcion: string) {
    switch (opcion) {
      case 'todasSucursales':
        this.todasSucursales = !this.todasSucursales;
        this.todasSucursales ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        this.todasSucursales ? this.getServicios(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadas':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        this.sucursalesSeleccionadas.length > 0 ? this.getServicios(this.sucursalesSeleccionadas) : null;
        break;
      case 'todosCajeros':
        this.todosCajeros = !this.todosCajeros;
        this.verCajero = false;
        if (this.todosCajeros) {
          this.verCajero = true;
        }
        if (this.cajerosSeleccionados.length > 0) {
          this.verCajero = true;
        }
        this.resumenEvaluacion = [];
        break;
      case 'cajerosSeleccionados':
        this.verCajero = false;
        if (this.cajerosSeleccionados.length > 0) {
          this.verCajero = true;
        }
        this.resumenEvaluacion = [];
        break;
      case 'todosServicios':
        this.todosServicios = !this.todosServicios;
        this.todosServicios ? this.getSubservicios(this.serviciosSeleccionados) : null;
        this.verServicio = false;
        if (this.todosServicios) {
          this.verServicio = true;
        }
        if (this.serviciosSeleccionados.length > 0) {
          this.verServicio = true;
        }
        this.resumenEvaluacion = [];
        break;
      case 'serviciosSeleccionados':
        this.verServicio = this.serviciosSeleccionados.length > 0;
        this.serviciosSeleccionados.length > 0 ? this.getSubservicios(this.serviciosSeleccionados) : null;
        this.resumenEvaluacion = [];
        break;
      case 'todosSubservicios':
        this.todosSubservicios = !this.todosSubservicios;
        this.verSubservicio = false;
        if (this.todosSubservicios) {
          this.verSubservicio = true;
        }
        if (this.selectedItems.length > 0) {
          this.verSubservicio = true;
        }
        this.resumenEvaluacion = [];
        break;
      case 'subserviciosSeleccionados':
        this.verSubservicio = false;
        if (this.selectedItems.length > 0) {
          this.verSubservicio = true;
        }
        this.resumenEvaluacion = [];
        break;
      default:
        break;
    }
  }

  // METOOD PARA LIMPIAR FORMULARIOS Y SELECCION DE BOTONES
  seleccionado_activo: boolean = true;
  LimpiarFormularios() {
    this.Limpiar();
    this.estadoUsuario = 2;
    const activo = document.getElementById('activo') as HTMLInputElement;
    activo.checked = true;
    const activoRF = document.getElementById('activoRF') as HTMLInputElement;
    activoRF.checked = true;
    this.verFecha = '1';
    const fecha = document.getElementById('fecha') as HTMLInputElement;
    fecha.checked = true;
    this.tipoEvaluacion = 3;
    const evaluacion = document.getElementById('todasE') as HTMLInputElement;
    evaluacion.checked = true;
  }

  Limpiar() {
    // FORMULARIO DE EVALUACIONES POR FECHA
    this.todosSubservicios = false;
    this.todasSucursales = false;
    this.todosServicios = false;
    this.todosCajeros = false;
    this.sucursalesSeleccionadas = [];
    this.serviciosSeleccionados = [];
    this.cajerosSeleccionados = [];
    this.resumenEvaluacion = this.arrayVacio;
    this.detectarCambios.detectChanges();
    this.selectedItems = [];
    this.mostrarCajeros = false;
    this.mostrarServicios = false;
    this.mostrarSubservicios = false;
    this.verCajero = false;
    this.verServicio = false;
    this.verSubservicio = false;
    this.listaEvaluaciones = this.arrayVacio;



    this.cajerosEval = [];

    this.todasSucursalesS = false;
    this.todasSucursalesG = false;;
    this.seleccionMultiple = false;
  }

  ObtenerNombreSucursal(sucursales: any) {
    const listaSucursales = sucursales;
    let nombreSucursal = "";
    listaSucursales.forEach((elemento: any) => {
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

  /** ** *************************************************************************************************** **
   ** **                           METODO DE BUSQUEDA DE EVALUACION POR FECHAS                            ** **
   ** ** *************************************************************************************************** **/
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  paginacionEvaluacionFechas(event: any) {
    this.configS.currentPage = event;
  }

  // METODO PARA SELCCIONAR ESTADO DE USUARIOS
  estadoUsuario: number = 2;
  CambiarEstado(estado: number) {
    this.estadoUsuario = estado;
    this.Limpiar();
  }

  verFecha: string = '1';
  CambiarFecha(opcion: string) {
    this.verFecha = opcion;
    this.Limpiar();
  }

  // METODO PARA BUSCAR EVALUACIONES DE ACUERDO A LOS FILTROS SELECCIONADOS
  BuscarResumenEvaluacion() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioRE.nativeElement.value;
    let horaFin = this.horaFinRE.nativeElement.value;

    var datoServicio: any = '0N';
    var datoSubservicio: any = '0N';
    var datoCajero: any = '0N';

    /*    console.log('ingresa ver sucursales ', this.sucursalesSeleccionadas);
        console.log('ingresa ver servicios', this.serviciosSeleccionados)
        console.log('ingresa ver subservicios', this.selectedItems)
        console.log('ingresa ver cajeros', this.cajerosSeleccionados)*/

    if (this.sucursalesSeleccionadas.length !== 0) {

      if (this.serviciosSeleccionados.length != 0) {
        datoServicio = this.serviciosSeleccionados;
      }

      if (this.selectedItems.length != 0) {
        datoSubservicio = this.selectedItems;
      }

      if (this.cajerosSeleccionados.length != 0) {
        datoCajero = this.cajerosSeleccionados;
      }

      // SERVICIOS
      this.serviceService
        .getResumenEvaluacion(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, this.sucursalesSeleccionadas, datoSubservicio, datoCajero, this.opcionCuatro.toString(), this.estadoUsuario, this.verFecha)
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.resumenEvaluacion = servicio.turnos;
            console.log('ver res ', this.resumenEvaluacion)
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
              this.resumenEvaluacion = null;
              this.malRequestS = true;
              this.malRequestSPag = true;
              /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
                  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              **/
              if (this.resumenEvaluacion == null) {
                this.configS.totalItems = 0;
              } else {
                this.configS.totalItems = this.resumenEvaluacion.length;
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
    } else {
      // SI SE SELECCIONA OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.resumenEvaluacion = null;
      this.malRequestS = true;
      this.malRequestSPag = true;
    }
  }

  exportarExcelEvalaucionFechas() {
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);
    // SERVICIOS
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.resumenEvaluacion.length; i++) {
      const item = {
        ...(this.todasSucursalesS || this.seleccionMultiple
          ? { Sucursal: this.resumenEvaluacion[i].nombreEmpresa }
          : {}),
        "Servicio": this.resumenEvaluacion[i].Servicio,
        "Subservicio": this.resumenEvaluacion[i].subservicio,
        "Cajero(a)": this.resumenEvaluacion[i].Usuario,
        Fecha: this.addOneDay(new Date(this.resumenEvaluacion[i].Fecha)),
        Excelente: this.resumenEvaluacion[i].Excelente,
        ...(!this.opcionCuatro
          ? { "Muy Bueno": this.resumenEvaluacion[i].Muy_Bueno }
          : {}),
        Bueno: this.resumenEvaluacion[i].Bueno,
        Regular: this.resumenEvaluacion[i].Regular,
        Malo: this.resumenEvaluacion[i].Malo,
        Total: this.resumenEvaluacion[i].Total,
        Promedio: this.resumenEvaluacion[i].Promedio,
      };

      jsonServicio.push(item);
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.resumenEvaluacion[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    XLSX.writeFile(
      wb,
      "Servicios - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  // GENERACION DE PDF'S
  GenerarPDFEvaluacionFechas(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.DocumentarEvalaucionFechas(
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
  DocumentarEvalaucionFechas(fechaDesde: any, fechaHasta: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);
    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      pageSize: 'A4',
      pageOrientation: 'landscape',
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
        // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA
        this.opcionCuatro
          ? this.serviciosC(this.resumenEvaluacion)
          : this.servicios(this.resumenEvaluacion),
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
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Subservicio", style: "tableHeader" },
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
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.subservicio },
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
            "auto",
            "auto",
          ],
          body: [
            [
              { text: "Servicio", style: "tableHeader" },
              { text: "Subservicio", style: "tableHeader" },
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
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.subservicio },
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


  /** ** *************************************************************************************************** **
   ** **                       METODO DE BUSQUEDA DE EVALAUCION POR RANGO DE FECHAS                       ** **
   ** ** *************************************************************************************************** **/

  // PAGINACION DE LA TABLA DE EVALUACIONES POR TURNO
  paginacionEvaluacionTurno(event: any) {
    this.configE.currentPage = event;
  }

  // METODO PARA SELCCIONAR TIPO DE EVALUACION
  tipoEvaluacion: number = 3;
  CambiarEvaluacion(estado: number) {
    this.tipoEvaluacion = estado;
    this.Limpiar();
  }

  MostrarEvaluaciones() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.desdeEvalT.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaEvalT.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioET.nativeElement.value;
    let horaFin = this.horaFinET.nativeElement.value;

    var datoServicio: any = '0N';
    var datoSubservicio: any = '0N';
    var datoCajero: any = '0N';

    if (this.sucursalesSeleccionadas.length !== 0) {

      if (this.serviciosSeleccionados.length != 0) {
        datoServicio = this.serviciosSeleccionados;
      }

      if (this.selectedItems.length != 0) {
        datoSubservicio = this.selectedItems;
      }

      if (this.cajerosSeleccionados.length != 0) {
        datoCajero = this.cajerosSeleccionados;
      }

      if (this.tipoEvaluacion === 1) {
        this.ConsultarEvaluacionesOmitidas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero, '');
      }
      else {
        this.BuscarEvaluacionPorTurnos(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero);
      }
    }
    else {
      // SI ELIGE OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.listaEvaluaciones = null;
      this.malRequestE = true;
      this.malRequestEPag = true;
    }

  }

  BuscarEvaluacionPorTurnos(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, datoServicio: any, datoSubservicio: any, datoCajero: any) {
    this.serviceService
      .getEvaluacionTurnos(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas, datoServicio, datoSubservicio, datoCajero, this.estadoUsuario, this.opcionCuatro.toString())
      .subscribe(
        (servicio: any) => {
          let evaluaciones = servicio.turnos;
          if (this.tipoEvaluacion === 3) {
            this.ConsultarEvaluacionesOmitidas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero, evaluaciones);
          }
          else {
            this.ProcesarDatos(evaluaciones, '');
          }
        },
        (error) => {
          if (error.status == 400) {
            if (this.tipoEvaluacion === 3) {
              this.ConsultarEvaluacionesOmitidas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero, '');
            }
            else {
              this.ErrorConsulta();
            }
          }
        }
      );
  }

  ConsultarEvaluacionesOmitidas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, datoServicio: any, datoSubservicio: any, datoCajero: any, evaluaciones: any) {
    this.serviceService
      .getEvaluacionOmitidaTurnos(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas, datoServicio, datoSubservicio, datoCajero, this.estadoUsuario)
      .subscribe(
        (servicio: any) => {
          let omitidas = servicio.turnos;
          this.ProcesarDatos(evaluaciones, omitidas);
        }, (error) => {
          if (error.status == 400) {
            if (this.tipoEvaluacion === 3) {
              this.ProcesarDatos(evaluaciones, '');
            }
            else {
              this.ErrorConsulta();
            }
          }
        })
  }

  ErrorConsulta() {
    // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISIBLES  DE INTERFAZ
    this.listaEvaluaciones = null;
    this.malRequestE = true;
    this.malRequestEPag = true;
    /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
        CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
    **/
    if (this.listaEvaluaciones == null) {
      this.configE.totalItems = 0;
    } else {
      this.configE.totalItems = this.listaEvaluaciones.length;
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

  ProcesarDatos(evaluaciones: any, omitidas: any) {
    if (evaluaciones.length != 0) {
      if (omitidas.length != 0) {
        omitidas.forEach((omitir: any) => {
          evaluaciones.push(omitir);
        })
      }
      this.listaEvaluaciones = evaluaciones;
    }
    else {
      this.listaEvaluaciones = omitidas;
    }

    let numero: number = 0;
    // PROCESAR DATOS
    this.listaEvaluaciones.forEach((dato: any) => {
      numero++;
      dato.numero = numero;
      // SIGLAS DEL TURNO
      if (this.verSiglas === 'subservicio') {
        dato.turno = dato.turno_subservicio;
      }
      else {
        dato.turno = dato.turno_servicio;
      }
      // HORAS DE LA EVALUACION
      if (dato.eval_hora < 10) {
        dato.eval_hora = '0' + dato.eval_hora
      }
      if (dato.eval_minuto < 10) {
        dato.eval_minuto = '0' + dato.eval_minuto
      }
      dato.hora = dato.eval_hora + ':' + dato.eval_minuto;
      // INFORMACION DEL CLIENTE
      if (this.verCliente != '' && this.verCliente != null) {
        if (this.verCliente === 'nombre') {
          dato.informacion = dato.nombre_cliente;
        }
        else if (this.verCliente === 'cedula') {
          dato.informacion = dato.cedula_cliente;
        }
        else if (this.verCliente === 'otro') {
          dato.informacion = dato.informacion_cliente;
        }
      }
    })

    console.log('ver datos ', this.listaEvaluaciones)

    this.malRequestE = false;
    this.malRequestEPag = false;
    // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
    if (this.configE.currentPage > 1) {
      this.configE.currentPage = 1;
    }
  }

  exportarAExcelEvalEmpl() {
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.listaEvaluaciones.length; i++) {
      const item = {
        ...(this.todasSucursales || this.seleccionMultiple
          ? { Sucursal: this.listaEvaluaciones[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.listaEvaluaciones[i].usua_nombre,
        Fecha: this.addOneDay(new Date(this.listaEvaluaciones[i].fecha)),
        Excelente: this.listaEvaluaciones[i].Excelente,
        ...(!this.opcionCuatro
          ? { "Muy Bueno": this.listaEvaluaciones[i].Muy_Bueno }
          : {}),
        Bueno: this.listaEvaluaciones[i].Bueno,
        Regular: this.listaEvaluaciones[i].Regular,
        Malo: this.listaEvaluaciones[i].Malo,
        Total: this.listaEvaluaciones[i].Total,
        Promedio: this.listaEvaluaciones[i].Promedio,
      };
      jsonServicio.push(item);
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DE LA HOJA
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.listaEvaluaciones[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Empleado");

    XLSX.writeFile(
      wb,
      "Evaluacion-cajero - " +
      nombreSucursal +
      " - " +
      new Date().toLocaleString() +
      EXCEL_EXTENSION
    );
  }

  generarPdfEvalEmpl(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fechaDesde = this.desdeEvalT.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaEvalT.nativeElement.value
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
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);

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
          ? this.empleadoC(this.listaEvaluaciones)
          : this.empleado(this.listaEvaluaciones),
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
    if (this.todasSucursales || this.seleccionMultiple) {
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
  empleadoC(servicio: any[]) {
    if (this.todasSucursales || this.seleccionMultiple) {
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


  /** ** *************************************************************************************************** **
   ** **                          METODO DE BUSQUEDA DE EVALAUCION CON GRAFICOS                           ** **
   ** ** *************************************************************************************************** **/

  // CAMBIO ORIENTACION
  CambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  // FUNCION QUE DETECTA CAMBIO DE TIPO DE GRAFICO, Y CREA UNO NUEVO
  CambiarGrafico(tipo: string) {
    this.tipo = tipo;
    if (this.chart) {
      this.chart.destroy();
    }
    this.leerGraficosevabar();
  }






































  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }





  leerGraficosevabar() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioRE.nativeElement.value;
    let horaFin = this.horaFinRE.nativeElement.value;

    this.malRequestGra = false;


    if (this.selectedItems.length !== 0) {
      this.serviceService
        .getgraficobarrasfiltro(fechaDesde, fechaHasta, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas, this.opcionCuatro.toString())
        .subscribe(
          (servicioGra: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioGra = servicioGra.turnos;
            this.malRequestGraPag = false;

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





  // Función para sumar un día a la fecha
  addOneDay(date: Date): Date {
    date.setDate(date.getDate() + 1);
    return date;
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
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);

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






  // PDF DE GRAFICOS
  generarPdfGra(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value
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
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);

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
