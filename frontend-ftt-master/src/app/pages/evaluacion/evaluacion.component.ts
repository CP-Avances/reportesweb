import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { saveAs } from 'file-saver';
import { Utils } from "../../utils/util";
//import ExcelJS from "exceljs";

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
  p_color = "#affbfb";
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

  selectedItems: any[] = [];
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
    this.orientacion = "landscape";
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
    this.subservicios = this.arrayVacio;
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

  // CONTROL DE SELECCION DE DATOS
  selectAll(opcion: string) {
    switch (opcion) {
      case 'todasSucursales':
        this.todasSucursales = !this.todasSucursales;
        if (this.todasSucursales) {
          this.getCajeros(this.sucursalesSeleccionadas);
          this.getServicios(this.sucursalesSeleccionadas);
        } else {
          if (this.sucursalesSeleccionadas.length != 0) {
            this.getCajeros(this.sucursalesSeleccionadas);
            this.getServicios(this.sucursalesSeleccionadas);
          }
          // LIMPIAR FORMULARIO
          this.listaServicios = [];
          this.mostrarServicios = false;
          this.verServicio = false;
          this.todosServicios = false;
          this.serviciosSeleccionados = [];

          this.subservicios = [];
          this.mostrarSubservicios = false;
          this.verSubservicio = false;
          this.todosSubservicios = false;
          this.selectedItems = [];

          this.cajerosEval = [];
          this.mostrarCajeros = false;
          this.cajerosSeleccionados = [];
          this.verCajero = false;
          this.todosCajeros = false;

        }
        break;

      case 'sucursalesSeleccionadas':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        if (this.sucursalesSeleccionadas.length > 0) {
          this.getCajeros(this.sucursalesSeleccionadas);
          this.getServicios(this.sucursalesSeleccionadas);
        } else {
          // LIMPIAR FORMULARIO
          this.listaServicios = [];
          this.mostrarServicios = false;
          this.verServicio = false;
          this.todosServicios = false;
          this.serviciosSeleccionados = [];

          this.subservicios = [];
          this.mostrarSubservicios = false;
          this.verSubservicio = false;
          this.todosSubservicios = false;
          this.selectedItems = [];

          this.cajerosEval = [];
          this.mostrarCajeros = false;
          this.cajerosSeleccionados = [];
          this.verCajero = false;
          this.todosCajeros = false;

        }
        break;

      case 'todosCajeros':
        this.todosCajeros = !this.todosCajeros;
        this.verCajero = this.todosCajeros || this.cajerosSeleccionados.length > 0;
        if (!this.todosCajeros) {
          this.cajerosSeleccionados = [];
        }
        this.resumenEvaluacion = [];
        break;

      case 'cajerosSeleccionados':
        this.verCajero = this.cajerosSeleccionados.length > 0;
        this.resumenEvaluacion = [];
        break;

      case 'todosServicios':
        this.todosServicios = !this.todosServicios;
        this.verServicio = this.todosServicios || this.serviciosSeleccionados.length > 0;
        if (this.todosServicios) {
          this.getSubservicios(this.serviciosSeleccionados);
        } else {
          if (this.serviciosSeleccionados.length === 0) {
            this.subservicios = [];
            this.selectedItems = [];
            this.mostrarSubservicios = false;
          } else {
            this.getSubservicios(this.serviciosSeleccionados);
          }
        }
        this.resumenEvaluacion = [];
        break;

      case 'serviciosSeleccionados':
        if (this.serviciosSeleccionados.length > 0) {
          this.verServicio = true;
          this.todosSubservicios = false;
          this.getSubservicios(this.serviciosSeleccionados);
        } else {
          this.verServicio = this.todosServicios;
          console.log('ver todosServicios ', this.todosServicios)
          if (!this.todosServicios) {
            this.subservicios = [];
            this.selectedItems = [];
            this.mostrarSubservicios = false;
          }
        }
        this.resumenEvaluacion = [];
        break;

      case 'todosSubservicios':
        this.todosSubservicios = !this.todosSubservicios;
        this.verSubservicio = this.todosSubservicios || this.selectedItems.length > 0;
        if (!this.todosSubservicios) {
          this.selectedItems = [];
        }
        this.resumenEvaluacion = [];
        break;

      case 'subserviciosSeleccionados':
        this.verSubservicio = this.selectedItems.length > 0;
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
    this.opcionesGrafico = 'sucursalG';
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
    this.selectedItems = [];

    this.resumenEvaluacion = this.arrayVacio;
    this.listaEvaluaciones = this.arrayVacio;
    this.detectarCambios.detectChanges();

    this.mostrarCajeros = false;
    this.mostrarServicios = false;
    this.mostrarSubservicios = false;
    this.verCajero = false;
    this.verServicio = false;
    this.verSubservicio = false;

    this.subservicios = [];
    this.listaServicios = [];
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
        nombreSucursal = "GENERALES";
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

  MostrarResumenEvaluaciones() {
    this.opcionesGrafico = 'sucursalG';
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value.toString().trim();

    let horaInicio = this.horaInicioRE.nativeElement.value;
    let horaFin = this.horaFinRE.nativeElement.value;

    var datoServicio: any = '0N';
    var datoSubservicio: any = '0N';
    var datoCajero: any = '0N';

    if (this.sucursalesSeleccionadas.length != 0) {

      if (this.serviciosSeleccionados.length != 0) {
        datoServicio = this.serviciosSeleccionados;
      }

      if (this.selectedItems.length != 0) {
        datoSubservicio = this.selectedItems;
      }

      if (this.cajerosSeleccionados.length != 0) {
        datoCajero = this.cajerosSeleccionados;
      }
      this.BuscarResumenEvaluacion(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero);

    } else {
      this.toastr.info("No ha seleccionado datos.", "Upss !!!.", {
        timeOut: 6000,
      });
      // SI SE SELECCIONA OPCION POR DEFECTO SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
      this.resumenEvaluacion = this.arrayVacio;
      this.malRequestS = true;
      this.malRequestSPag = true;
    }
  }

  // METODO PARA BUSCAR EVALUACIONES DE ACUERDO A LOS FILTROS SELECCIONADOS
  BuscarResumenEvaluacion(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, datoServicio: any, datoSubservicio: any, datoCajero: any,) {
    // SERVICIOS
    this.serviceService
      .getResumenEvaluacion(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, this.sucursalesSeleccionadas, datoSubservicio, datoCajero, this.opcionCuatro.toString(), this.estadoUsuario, this.verFecha)
      .subscribe(
        (servicio: any) => {
          let informacion = servicio.turnos;
          //console.log('informacion ', informacion)
          console.log('ingresa existe evaluaciones ');
          this.BuscarResumenOmitidas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero, informacion);
        },
        (error) => {
          if (error.status == 400) {
            console.log('ingresa no existe evaluaciones ');
            this.BuscarResumenOmitidas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, datoSubservicio, datoCajero, '');
          }
        }
      );
  }

  // METODO PARA BUSCAR EVALUACIONES DE ACUERDO A LOS FILTROS SELECCIONADOS
  BuscarResumenOmitidas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, datoServicio: any, datoSubservicio: any, datoCajero: any, evaluaciones: any) {
    // SERVICIOS
    this.serviceService
      .getResumenEvaluacionOmitidas(fechaDesde, fechaHasta, horaInicio, horaFin, datoServicio, this.sucursalesSeleccionadas, datoSubservicio, datoCajero, this.opcionCuatro.toString(), this.estadoUsuario, this.verFecha)
      .subscribe(
        (servicio: any) => {
          let omitidas = servicio.turnos;
          console.log('ingresa existe omitidas ', evaluaciones);
          this.ProcesarDatosResumen(evaluaciones, omitidas);
        },
        (error) => {
          if (error.status == 400) {
            if (evaluaciones != 0) {
              console.log('ingresa no existe omitidas pero si evaluaciones', evaluaciones);
              this.ProcesarDatosResumen(evaluaciones, '');
            }
            else {
              this.ErrorResumen();
            }
          }
        }
      );
  }

  ErrorResumen() {
    // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES DE INTERFAZ
    this.resumenEvaluacion = this.arrayVacio;
    this.malRequestS = true;
    this.malRequestSPag = true;
    /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
        CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
    **/
    if (this.resumenEvaluacion.length === 0) {
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

  ProcesarDatosResumen(evaluaciones: any, omitidas: any) {
    //console.log('ver datos evaluaciones ', evaluaciones);
    //console.log('ver datos omitidas ', omitidas);

    this.resumenEvaluacion = [];
    // TRATAMIENTO DE DATOS DE PAGINACION
    this.malRequestS = false;
    this.malRequestSPag = false;
    if (this.configS.currentPage > 1) {
      this.configS.currentPage = 1;
    }

    // SI EVALUACIONES ESTA VACIO, ASIGNAMOS OMITIDAS DIRECTAMENTE
    if (evaluaciones.length === 0) {
      this.resumenEvaluacion = [...omitidas];
      //console.log('ver datos generales ', this.resumenEvaluacion);
      return;
    }
    // SI OMITIDAS ESTA VACIO, ASIGNAMOS EVALUACIONES DIRECTAMENTE
    if (omitidas.length === 0) {
      this.resumenEvaluacion = [...evaluaciones];
      //console.log('ver datos generales ', this.resumenEvaluacion);
      return;
    }

    // DETERMINAR CLAVES DE COMPARACION DINAMICAMENTE
    const claves = [];
    if (this.verFecha === '1') claves.push('Fecha');
    if (this.verCajero) claves.push('usua_codigo');
    if (this.verServicio) claves.push('serv_codigo');
    if (this.verSubservicio) claves.push('sub_codigo');

    let soloOmitidas = [];

    // FUSIONAR OMITIDAS CON EVALUACIONES SI COINCIDEN EN LAS CLAVES
    evaluaciones.forEach((evalua: any) => {
      omitidas.forEach((omitida: any) => {
        const coincide = claves.every((clave) => evalua[clave] === omitida[clave]);
        if (coincide) {
          evalua.Omitidas += omitida.Omitidas;
          evalua.Total += omitida.Total;
          soloOmitidas.push(omitida);
        }
      });
    });

    // FILTRAR OMITIDAS QUE YA FUERON COMBINADAS CON EVALUACIONES
    const omitidasProcesadas = new Set(soloOmitidas.map((obj: any) => JSON.stringify(obj)));
    const omitidasRestantes = omitidas.filter((o: any) => !omitidasProcesadas.has(JSON.stringify(o)));

    // AGREGAR OMITIDAS RESTANTES A EVALUACIONES
    this.resumenEvaluacion = [...evaluaciones, ...omitidasRestantes];
  }

  /** ** *************************************************************************************************** **
   ** **                                METODO DE GENERACION DE GRAFICOS                                  ** **
   ** ** *************************************************************************************************** **/

  // FUNCION QUE DETECTA CAMBIO DE TIPO DE GRAFICO, Y CREA UNO NUEVO
  opcionesGrafico: string = 'sucursalG';
  CambiarOpcionesGrafico(opciones: string) {
    this.opcionesGrafico = opciones;
  }

  CambiarGrafico(tipo: string) {
    if (this.chart) {
      this.chart.destroy();
    }

    let labels: any;

    // FUNCION PARA VALIDAR UNA SELECCION
    const esSeleccionValida = (lista: any[]) => lista.length === 1 && lista[0] != '-1';

    switch (this.opcionesGrafico) {
      case 'subservicioG':
        if (esSeleccionValida(this.sucursalesSeleccionadas) && esSeleccionValida(this.serviciosSeleccionados)) {
          if (this.verCajero && !esSeleccionValida(this.cajerosSeleccionados)) {
            this.VerMensaje();
            return;
          }
          labels = this.resumenEvaluacion.map((e: any) => e.subservicio);
        } else {
          this.VerMensaje();
          return;
        }
        break;

      case 'servicioG':
        if (esSeleccionValida(this.sucursalesSeleccionadas)) {
          if (this.verCajero && !esSeleccionValida(this.cajerosSeleccionados)) {
            this.VerMensaje();
            return;
          }
          if (this.verSubservicio && !esSeleccionValida(this.selectedItems)) {
            this.VerMensaje();
            return;
          }
          labels = this.resumenEvaluacion.map((e: any) => e.Servicio);
        } else {
          this.VerMensaje();
          return;
        }
        break;

      case 'cajeroG':
        if (esSeleccionValida(this.sucursalesSeleccionadas)) {
          if (this.verServicio && !esSeleccionValida(this.serviciosSeleccionados)) {
            this.VerMensaje();
            return;
          }
          if (this.verSubservicio && !esSeleccionValida(this.selectedItems)) {
            this.VerMensaje();
            return;
          }
          labels = this.resumenEvaluacion.map((e: any) => e.Usuario);
        } else {
          this.VerMensaje();
          return;
        }
        break;

      case 'sucursalG':
        if (this.verServicio && !esSeleccionValida(this.serviciosSeleccionados)) {
          this.VerMensaje();
          return;
        }
        if (this.verSubservicio && !esSeleccionValida(this.selectedItems)) {
          this.VerMensaje();
          return;
        }
        if (this.verCajero && !esSeleccionValida(this.cajerosSeleccionados)) {
          this.VerMensaje();
          return;
        }
        labels = this.resumenEvaluacion.map((e: any) => e.nombreEmpresa);
        break;

      default:
        this.VerMensaje();
        return;
    }

    this.PresentarGrafico(labels, tipo);
  }

  PresentarGrafico(labels: any, tipo: any) {
    // LOS VALORES NUMERICOS DE PROMEDIO Y OMITIDAS
    const dataEvaluadas = this.resumenEvaluacion.map((e: any) => e.Evaluadas);
    const dataOmitidas = this.resumenEvaluacion.map((e: any) => e.Omitidas);
    // COLORES GENERADOS
    const colorsEvaluados = this.resumenEvaluacion.map(() => this.GenerarColoresEvaluadas());
    const colorsOmitidas = this.resumenEvaluacion.map(() => this.GenerarColoresOmitidas());
    this.tipo = tipo;
    if (tipo === 'bar') {
      this.generarGraficoBarra(labels, dataEvaluadas, dataOmitidas, colorsEvaluados, colorsOmitidas);
    }
    else {
      this.generarGraficoPastel(labels, dataEvaluadas, dataOmitidas, colorsEvaluados, colorsOmitidas);
    }
  }

  generarGraficoBarra(etiquetas: any, dataEvaluadas: any, dataOmitidas: any, colorsEvaluados: any, colorsOmitidas: any) {
    const labels = etiquetas;  // Nombres de las sucursales
    // CREAMOS LOS DATASETS
    const promedioDataset = {
      label: 'Evaluaciones',
      data: dataEvaluadas,  // LOS VALORES DE PROMEDIO 
      backgroundColor: colorsEvaluados,  // COLORES
      borderColor: colorsEvaluados.map((color: any) => color.replace('0.6', '1')),  // COLORES CON MAS OPACIDAD PARA LOS BORDES
      borderWidth: 1
    };
    const omitidasDataset = {
      label: 'Omitidas',
      data: dataOmitidas,  // LOS VALORES DE OMITIDAS
      backgroundColor: colorsOmitidas,  // COLORES
      borderColor: colorsOmitidas.map((color: any) => color.replace('0.6', '1')),  // BORDES CON MAS OPACIDAD
      borderWidth: 1
    };
    // GENERAR GRAFICO
    this.chart = new Chart("canvas", {
      type: 'bar',
      data: {
        labels: labels,  // ETIQUETAS
        datasets: [promedioDataset, omitidasDataset]  // ANADIMOS LOS DATASETS PARA PROMEDIO Y OMITIDAS
      },
      options: {
        responsive: true,
        scales: {
          x: {
            stacked: false  // ASEGURA QUE LAS BARRAS NO SE APILEN
          },
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetIndex = context.datasetIndex;
                const dataIndex = context.dataIndex;

                // TOOLTIP PARA PROMEDIO (VALOR STRING COMO "EXCELENTE") Y OMITIDAS (VALOR NUMERICO)
                if (datasetIndex === 0) {  // PARA EVALUACIONES
                  return `${context.label}: ${this.resumenEvaluacion[dataIndex].Promedio}`;
                } else {  // PARA OMITIDAS
                  return `${context.label}: ${context.raw}`;
                }
              }
            }
          },
          legend: {
            labels: {
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                const labels = [];
                // GENERAR ETIQUETAS PERSONALIZADAS
                datasets.forEach((dataset, datasetIndex) => {
                  dataset.data.forEach((dataValue, dataIndex) => {
                    const tipo = chart.data.labels[dataIndex];
                    const label = `${tipo} - ${dataset.label}: ${dataValue}`;
                    labels.push({
                      text: label,
                      fillStyle: dataset.backgroundColor[dataIndex],
                      strokeStyle: dataset.borderColor[dataIndex],
                      lineWidth: 1,
                      hidden: false
                    });
                  });
                });
                return labels;
              }
            }
          }
        }
      }
    });
  }

  generarGraficoPastel(etiquetas: any, dataEvaluadas: any, dataOmitidas: any, colorsEvaluados: any, colorsOmitidas: any) {
    const labels = etiquetas;   // ETIQUETAS
    // CREAMOS LOS DATASETS
    const promedioDataset = {
      label: 'Evaluaciones',
      data: dataEvaluadas,  // LOS VALORES DE PROMEDIO
      backgroundColor: colorsEvaluados,  // COLORES
      borderColor: colorsEvaluados.map((color: any) => color.replace('0.6', '1')),  // COLORES CON MAS OPACIDAD PARA LOS BORDES
      borderWidth: 1
    };
    const omitidasDataset = {
      label: 'Omitidas',
      data: dataOmitidas,  // LOS VALORES DE OMITIDAS
      backgroundColor: colorsOmitidas,  // 
      borderColor: colorsOmitidas.map((color: any) => color.replace('0.6', '1')),  // BORDES CON MAS OPACIDAD
      borderWidth: 1
    };
    // GENERAR GRAFICO
    this.chart = new Chart("canvas", {
      type: 'pie',
      data: {
        labels: labels,  // LAS ETIQUETAS
        datasets: [promedioDataset, omitidasDataset]  // ANADIMOS LOS DATASETS PARA PROMEDIO Y OMITIDAS
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetIndex = context.datasetIndex;
                const dataIndex = context.dataIndex;
                // TOOLTIP PARA PROMEDIO (VALOR STRING COMO "EXCELENTE") Y OMITIDAS (VALOR NUMERICO)
                if (datasetIndex === 0) {  // PARA EVALUADAS
                  return `${context.label}: ${this.resumenEvaluacion[dataIndex].Promedio}`;
                } else {  // PARA OMITIDAS
                  return `${context.label}: ${context.raw}`;
                }
              }
            }
          },
          legend: {
            labels: {
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                const labels = [];
                // GENERAR ETIQUETAS PERSONALIZADAS
                datasets.forEach((dataset, datasetIndex) => {
                  dataset.data.forEach((dataValue, dataIndex) => {
                    const tipo = chart.data.labels[dataIndex];
                    const label = `${tipo} - ${dataset.label}: ${dataValue}`;

                    labels.push({
                      text: label,
                      fillStyle: dataset.backgroundColor[dataIndex],
                      strokeStyle: dataset.borderColor[dataIndex],
                      lineWidth: 1,
                      hidden: false
                    });
                  });
                });
                return labels;
              }
            }
          }
        }
      }
    });
  }

  // FUNCION PARA GENERAR UN COLOR ALEATORIO
  GenerarColoresEvaluadas() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.6)`;
  }

  // FUNCION PARA GENERAR UN COLOR ALEATORIO
  GenerarColoresOmitidas() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.6)`;
  }

  VerMensaje() {
    this.toastr.info("Los filtros aplicados no son válidos. Cada filtro debe tener solo una opción seleccionada, excepto el filtro correspondiente al Tipo de Grráfico seleccionado, que puede contener más de un registro", "Upss !!!.", {
      timeOut: 6000,
    });
  }

  GenerarExcelEvaluaciones() {
    /*
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Resumen Evaluaciones");
  
    // DEFINIR ENCABEZADOS DINAMICAMENTE
    let headers = ["Sucursal"];
    if (this.verSubservicio) {
      headers.push("Servicio", "Subservicio");
    } else if (this.verServicio) {
      headers.push("Servicio");
    }
    if (this.verCajero) {
      headers.push("Cajero(a)");
    }
    if (this.verFecha === "1") {
      headers.push("Fecha");
    }
    headers.push("Excelente");
    if (!this.opcionCuatro) {
      headers.push("Muy Bueno");
    }
    headers.push("Bueno", "Regular", "Malo", "Total Evaluadas", "Total Omitidas", "Total General", "Promedio");
  
    // AGREGAR ENCABEZADOS A LA HOJA
    worksheet.addRow(headers).font = { bold: true };
  
    // AGREGAR DATOS DINAMICOS
    this.resumenEvaluacion.forEach(res => {
      let row = [res.nombreEmpresa];
      if (this.verSubservicio) {
        row.push(res.Servicio, res.subservicio);
      } else if (this.verServicio) {
        row.push(res.Servicio);
      }
      if (this.verCajero) {
        row.push(res.Usuario);
      }
      if (this.verFecha === "1") {
        row.push(res.Fecha);
      }
      row.push(res.Excelente);
      if (!this.opcionCuatro) {
        row.push(res.Muy_Bueno);
      }
      row.push(res.Bueno, res.Regular, res.Malo, res.Evaluadas, res.Omitidas, res.Total, res.Promedio);
      worksheet.addRow(row);
    });
  
    // AJUSTAR EL ANCHO DE LAS COLUMNAS AUTOMATICAMENTE
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        let cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    });
  
    // ESTILOS DE ENCABEZADO
    worksheet.getRow(1).eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCC00" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.font = { bold: true };
    });
  
    // GENERAR ARCHIVO EXCEL Y DESCARGARLO
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, "ResumenEvaluaciones.xlsx");
    });
*/
  }



















  // GENERACION DE PDF'S
  GenerarPDFEvaluacionFechas(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.DocumentarEvaluacionFechas(
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
  DocumentarEvaluacionFechas(fechaDesde: any, fechaHasta: any) {
    if (this.verFecha != '1') {
      var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
      // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
      var canvasImg = canvas1.toDataURL("image/png");
    }
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours());
    this.date = f.toJSON();
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);
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
        { text: `RESUMEN DE EVALUACIONES`, bold: true, fontSize: 14, alignment: 'center', margin: [0, -30, 0, 5] },
        { text: nombreSucursal?.toUpperCase(), bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        { text: `PERIODO DEL ${fechaDesde} HASTA ${fechaHasta}`, bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        this.TratamientoInformacionEvaluacion(this.resumenEvaluacion),
        this.LeerGraficoEvaluaciones(canvasImg),
      ],
      styles: {
        tableHeader: { fontSize: 8, bold: true, alignment: 'center', fillColor: this.p_color },
        itemsTable: { fontSize: 8, alignment: 'center' },
      }
    };
  }

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND SERVICIOS
  TratamientoInformacionEvaluacion(servicio: any[]) {
    let headers = [{ text: "Sucursal", style: "tableHeader", alignment: 'center', }];
    let includeSubservicio = this.verSubservicio;
    let includeServicio = this.verServicio;
    let includeCajero = this.verCajero;
    let includeFecha = this.verFecha === "1";
    let includeMuyBueno = !this.opcionCuatro;

    if (includeSubservicio) {
      headers.push({ text: "Servicio", style: "tableHeader", alignment: 'center' });
      headers.push({ text: "Subservicio", style: "tableHeader", alignment: 'center' });
    } else if (includeServicio) {
      headers.push({ text: "Servicio", style: "tableHeader", alignment: 'center' });
    }

    if (includeCajero) {
      headers.push({ text: "Cajero(a)", style: "tableHeader", alignment: 'center' });
    }

    if (includeFecha) {
      headers.push({ text: "Fecha", style: "tableHeader", alignment: 'center' });
    }

    headers.push({ text: "Excelente", style: "tableHeader", alignment: 'center' });

    if (includeMuyBueno) {
      headers.push({ text: "Muy Bueno", style: "tableHeader", alignment: 'center' });
    }

    headers.push(...[
      { text: "Bueno", style: "tableHeader", alignment: 'center' },
      { text: "Regular", style: "tableHeader", alignment: 'center' },
      { text: "Malo", style: "tableHeader", alignment: 'center' },
      { text: "Total Evaluadas", style: "tableHeader", alignment: 'center' },
      { text: "Total Omitidas", style: "tableHeader", alignment: 'center' },
      { text: "Total General", style: "tableHeader", alignment: 'center' },
      { text: "Promedio", style: "tableHeader", alignment: 'center' }
    ]);

    let bodyRows = servicio.map((res) => {
      let row = [{ style: "itemsTable", text: res.nombreEmpresa, alignment: 'center' }];

      if (includeSubservicio) {
        row.push({ style: "itemsTable", text: res.Servicio, alignment: 'center' });
        row.push({ style: "itemsTable", text: res.subservicio, alignment: 'center' });
      } else if (includeServicio) {
        row.push({ style: "itemsTable", text: res.Servicio, alignment: 'center' });
      }

      if (includeCajero) {
        row.push({ style: "itemsTable", text: res.Usuario, alignment: 'center' });
      }

      if (includeFecha) {
        row.push({ style: "itemsTable", text: res.Fecha, alignment: 'center' });
      }

      row.push({ style: "itemsTable", text: res.Excelente, alignment: 'center' });

      if (includeMuyBueno) {
        row.push({ style: "itemsTable", text: res.Muy_Bueno, alignment: 'center' });
      }

      row.push(...[
        { style: "itemsTable", text: res.Bueno, alignment: 'center' },
        { style: "itemsTable", text: res.Regular, alignment: 'center' },
        { style: "itemsTable", text: res.Malo, alignment: 'center' },
        { style: "itemsTable", text: res.Evaluadas, alignment: 'center' },
        { style: "itemsTable", text: res.Omitidas, alignment: 'center' },
        { style: "itemsTable", text: res.Total, alignment: 'center' },
        { style: "itemsTable", text: res.Promedio, alignment: 'center' }
      ]);

      return row;
    });

    return {
      alignment: "center",
      table: {
        headerRows: 1,
        widths: headers.map(() => "auto"),
        body: [headers, ...bodyRows],
      },
      layout: {
        fillColor: function (rowIndex: any) {
          return rowIndex % 2 === 0 ? "#E5E7E9" : null;
        },
      },
      margin: [5, 0, 5, 0], // AGREGAR MARGEN LATERAL PARA CENTRAR MEJOR
    };
  }

  LeerGraficoEvaluaciones(imagen: any) {
    if (this.verFecha != '1') {
      let contenidoGrafico = [
        {
          text: "GRÁFICO DE EVALUACIONES",
          fontSize: 14,
          bold: true,
          alignment: "center",
          margin: [0, 10, 0, 10],
          pageBreak: "before"
        },
        {
          image: imagen,
          fit: [500, 350],
          margin: [0, 10, 0, 10],
          alignment: "center",
        }
      ];
      return contenidoGrafico;
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
    //console.log('ver datos ', this.listaEvaluaciones)
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








































  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
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
