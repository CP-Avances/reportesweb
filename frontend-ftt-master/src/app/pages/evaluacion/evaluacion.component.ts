import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, TrackByFunction } from "@angular/core";
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


  // VARIABLES DE FECHAS
  @ViewChild("fromDateServicios") fromDateServicios: ElementRef;
  @ViewChild("toDateServicios") toDateServicios: ElementRef;
  // VARIABLES DE HORAS
  @ViewChild("horaInicioS") horaInicioS: ElementRef;
  @ViewChild("horaFinS") horaFinS: ElementRef;

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


  @ViewChild("fromDateDesdeEvalEmpl") fromDateDesdeEvalEmpl: ElementRef;
  @ViewChild("toDateHastaEvalEmpl") toDateHastaEvalEmpl: ElementRef;
  @ViewChild("fromDateDesdeEvalOmitidas") fromDateDesdeEvalOmitidas: ElementRef;
  @ViewChild("toDateHastaEvalOmitidas") toDateHastaEvalOmitidas: ElementRef;
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


  @ViewChild("horaInicioC") horaInicioC: ElementRef;
  @ViewChild("horaFinC") horaFinC: ElementRef;
  @ViewChild("horaInicioO") horaInicioO: ElementRef;
  @ViewChild("horaFinO") horaFinO: ElementRef;
  @ViewChild("horaInicioG") horaInicioG: ElementRef;
  @ViewChild("horaFinG") horaFinG: ElementRef;




  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioServs: any = [];




  serviciosServs: any = [];
  subservicios: any = [];
  servicio2: any;
  servicio3: any;
  servicioEstb: any = [];
  servicio5: any;
  servicioe: any;
  servicioEvalEmpl: any = [];
  servicioEvalOmitidas: any = [];
  servicioEvalMMEmpl: any = [];
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
  todasSucursales: boolean = false;
  todosServicios: boolean = false;
  todosSubservicios: boolean = false;
  todosCajeros: boolean = false;

  todasSucursalesS: boolean = false;
  todasSucursalesEG: boolean = false;
  todasSucursalesG: boolean = false;
  todasSucursalesEST: boolean = false;
  todasSucursalesEO: boolean = false;
  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestS: boolean = false;
  malRequestSPag: boolean = false;
  malRequestE: boolean = false;
  malRequestEPag: boolean = false;
  malRequestEOmitidas: boolean = false;
  malRequestEOmitidasPag: boolean = false;
  malRequestGra: boolean = false;
  malRequestGraPag: boolean = false;

  // CONTROL DE OPCIONES DE EVALUACION
  opcionCuatro: boolean = false;
  // CONTROL PAGINACION
  configS: any;
  configSMM: any;
  configE: any;
  configEOmitidas: any;
  configEMM: any;
  configG: any;

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
    private serviceService: ServiceService,
    private router: Router,
    private toastr: ToastrService,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
    private detectarCambios: ChangeDetectorRef,
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE

    this.configS = {
      id: "Evals",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioServs.length,
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
    this.configG = {
      id: "Evalg",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioGra.length,
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
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

  pageChangedG(event: any) {
    this.configG.currentPage = event;
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
    this.malRequestEOmitidasPag = true;
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
  ObtenerOpcionesEvaluacion() {
    this.serviceService.getOpcionesEvaluacion().subscribe((opcion: any) => {
      this.opciones = opcion.opcion;
      if (this.opciones[0].gene_valor == "0") {
        this.opcionCuatro = true;
      }
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
    this.serviceService.getAllServiciosS(sucursal).subscribe((servicios: any) => {
      this.serviciosServs = servicios.servicios.filter(
        (valor: any, indice: any, self: any) =>
          self.findIndex((v: any) => v.serv_codigo === valor.serv_codigo) === indice
      );
      this.mostrarServicios = true;
    },
      (error) => {
        if (error.status == 400) {
          this.serviciosServs = [];
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
          this.serviciosServs = [];
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
        break;
      case 'cajerosSeleccionados':
        this.verCajero = false;
        if (this.cajerosSeleccionados.length > 0) {
          this.verCajero = true;
        }
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
        break;
      case 'serviciosSeleccionados':
        this.verServicio = this.serviciosSeleccionados.length > 0;
        this.serviciosSeleccionados.length > 0 ? this.getSubservicios(this.serviciosSeleccionados) : null;
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
        break;
      case 'subserviciosSeleccionados':
        this.verSubservicio = false;
        if (this.selectedItems.length > 0) {
          this.verSubservicio = true;
        }
        break;








      case 'allSelected':
        this.allSelected = !this.allSelected;
        break;
      case 'todasSucursalesEST':
        this.todasSucursalesEST = !this.todasSucursalesEST;
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

  /** ** *************************************************************************************************** **
   ** **                           METODO DE BUSQUEDA DE EVALAUCION POR FECHAS                            ** **
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

  // METODO PARA BUSCAR EVALUACIONES DE ACUERDO A LOS FILTROS SELECCIONADOS
  BuscarEvaluacionFechas() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateServicios.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateServicios.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioS.nativeElement.value;
    let horaFin = this.horaFinS.nativeElement.value;

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
        .getPromediosEvaluacionFechas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, this.sucursalesSeleccionadas, datoSubservicio, datoCajero, this.opcionCuatro.toString(), this.estadoUsuario)
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioServs = servicio.turnos;
            console.log('ver res ', this.servicioServs)
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
    } else {
      // SI SE SELECCIONA OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.servicioServs = null;
      this.malRequestS = true;
      this.malRequestSPag = true;
    }
  }

  exportarExcelEvalaucionFechas() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // SERVICIOS
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioServs.length; i++) {
      const item = {
        ...(this.todasSucursalesS || this.seleccionMultiple
          ? { Sucursal: this.servicioServs[i].nombreEmpresa }
          : {}),
        "Servicio": this.servicioServs[i].Servicio,
        "Subservicio": this.servicioServs[i].subservicio,
        "Cajero(a)": this.servicioServs[i].Usuario,
        Fecha: this.addOneDay(new Date(this.servicioServs[i].Fecha)),
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
    var fechaDesde = this.fromDateServicios.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateServicios.nativeElement.value.toString().trim();
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
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
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
          ? this.serviciosC(this.servicioServs)
          : this.servicios(this.servicioServs),
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









































  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
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



  Limpiar() {
    // FORMULARIO DE EVALUACIONES POR FECHA
    this.todosSubservicios = false;
    this.todasSucursales = false;
    this.todosServicios = false;
    this.todosCajeros = false;
    this.sucursalesSeleccionadas = [];
    this.serviciosSeleccionados = [];
    this.cajerosSeleccionados = [];
    this.servicioServs = this.arrayVacio;
    this.detectarCambios.detectChanges();
    this.selectedItems = [];
    this.mostrarCajeros = false;
    this.mostrarServicios = false;
    this.mostrarSubservicios = false;
    this.verCajero = false;
    this.verServicio = false;
    this.verSubservicio = false;



    this.cajerosEval = [];
    this.cajerosEvalOmitidas = [];
    this.allSelected = false;
    this.todasSucursalesS = false;
    this.todasSucursalesEG = false;
    this.todasSucursalesG = false;
    this.todasSucursalesEST = false;
    this.todasSucursalesEO = false;
    this.seleccionMultiple = false;
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
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

  // Función para sumar un día a la fecha
  addOneDay(date: Date): Date {
    date.setDate(date.getDate() + 1);
    return date;
  }



  exportarAExcelEvalEmpl() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    for (let i = 0; i < this.servicioEvalEmpl.length; i++) {
      const item = {
        ...(this.todasSucursales || this.seleccionMultiple
          ? { Sucursal: this.servicioEvalEmpl[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioEvalEmpl[i].usua_nombre,
        Fecha: this.addOneDay(new Date(this.servicioEvalEmpl[i].fecha)),
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
        ...(this.todasSucursales
          ? { Sucursal: this.servicioEvalMMEmpl[i].nombreEmpresa }
          : {}),
        "Cajero(a)": this.servicioEvalMMEmpl[i].usua_nombre,
        Fecha: this.addOneDay(new Date(this.servicioEvalMMEmpl[i].fecha)),
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
        Fecha: this.addOneDay(new Date(this.servicioEvalOmitidas[i].fecha)),
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
  maxmine(servicio: any[]) {
    if (this.todasSucursales || this.seleccionMultiple) {
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  maxmineC(servicio: any[]) {
    if (this.todasSucursales || this.seleccionMultiple) {
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

  // METOOD PARA LIMPIAR FORMULARIOS Y SELECCION DE BOTONES
  seleccionado_activo: boolean = true;
  LimpiarFormularios() {
    this.Limpiar();
    this.estadoUsuario = 2;
    const activo = document.getElementById('activo') as HTMLInputElement;
    activo.checked = true;
  }


}
