import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { saveAs } from 'file-saver';
import { Utils } from "../../utils/util";
import ExcelJS from "exceljs";

import { ServiceService } from "../../services/service.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from "../../services/authentication.service";

// COMPLEMENTO PARA GRAFICOS
import { Chart } from "chart.js";

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
  private imagen: any;

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

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursales: boolean = false;
  todosServicios: boolean = false;
  todosSubservicios: boolean = false;
  todosCajeros: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestS: boolean = false;
  malRequestSPag: boolean = false;
  malRequestE: boolean = false;
  malRequestEPag: boolean = false;

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

  // SELECCION DE DATOS
  selectedItems: any[] = [];
  sucursalesSeleccionadas: string[] = [];
  cajerosSeleccionados: string[] = [];
  serviciosSeleccionados: string[] = [];

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

  async ImportarPDF() {
    const pdfMake = await import('src/pdfmake/pdfmake.js');
    const pdfFonts = await import('src/pdfmake/vfs_fonts.js');
    pdfMake.default.vfs = pdfFonts.default.pdfMake.vfs;
    return pdfMake.default;
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
    this.mostrar_resultado = false

    this.estadoUsuario = estado;
    this.Limpiar();
  }
  mostrar_resultado = false;

  verFecha: string = '1';
  CambiarFecha(opcion: string) {
    this.mostrar_resultado = false

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
          this.mostrar_resultado = true
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
          this.ProcesarDatosResumen(evaluaciones, omitidas);
        },
        (error) => {
          if (error.status == 400) {
            if (evaluaciones != 0) {
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
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Resumen Evaluaciones");
    this.imagen = workbook.addImage({
      base64: this.urlImagen,
      extension: "png",
    });
    worksheet.addImage(this.imagen, {
      tl: { col: 0, row: 0 },
      ext: { width: 220, height: 105 },
    });
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);
    // COMBINAR CELDAS
    worksheet.mergeCells("B1:H1");
    worksheet.mergeCells("B2:H2");
    worksheet.mergeCells("B3:H3");
    worksheet.mergeCells("B4:H4");
    worksheet.mergeCells("B5:H5");

    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'RESUMEN DE EVALUACIONES'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.desdeRE.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaRE.nativeElement.value
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

    // DEFINIR ENCABEZADOS DINAMICAMENTE
    let headers = ["No."];
    headers.push("SUCURSAL");
    if (this.verSubservicio) {
      headers.push("SERVICIO", "SUBSERVICIO");
    } else if (this.verServicio) {
      headers.push("SERVICIO");
    }
    if (this.verCajero) {
      headers.push("CAJERO(A)");
    }
    if (this.verFecha === "1") {
      headers.push("FECHA");
    }
    headers.push("EXCELENTE");
    if (!this.opcionCuatro) {
      headers.push("MUY BUENO");
    }
    headers.push("BUENO", "REGULAR", "MALO", "TOTAL EVALUADAS", "TOTAL OMITIDAS", "TOTAL GENERAL", "PROMEDIO");

    // AGREGAR ENCABEZADOS A LA HOJA
    let headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };

    // APLICAR BORDES A LOS ENCABEZADOS
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // AGREGAR DATOS DINAMICOS
    this.resumenEvaluacion.forEach((res: any, index: number) => {
      let row = [index + 1];
      row.push(res.nombreEmpresa);
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
      // AGREGAR LA FILA A LA HOJA
      let newRow = worksheet.addRow(row);
      // APLICAR BORDES A CADA CELDA DE LA FILA
      newRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      // APLICAR ESTILO CEBRA (ALTERNANDO FONDO)
      if (index % 2 === 0) {
        newRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F2F2F2" }, // COLOR GRIS CLARO PARA FILAS IMPARES
          };
        });
      } else {
        newRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF" }, // COLOR BLANCO PARA FILAS PARES
          };
        });
      }
    });

    // AJUSTAR EL ANCHO DE LAS COLUMNAS AUTOMATICAMENTE
    worksheet.columns.forEach(column => {
      column.width = 30;
    });

    // ESTILOS DE ENCABEZADO
    worksheet.getRow(6).eachCell((cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" }, // COLOR BLANCO PARA EL TEXTO
      };
      // HABILITAR FILTRO EN LA CELDA
      worksheet.autoFilter = {
        from: { row: 6, column: 1 },  // INICIO DEL FILTRO (FILA 6, COLUMNA 1)
        to: { row: 6, column: worksheet.columnCount } // FIN DEL FILTRO (ÚLTIMA COLUMNA)
      };
    });


    // GENERAR ARCHIVO EXCEL Y DESCARGARLO
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, "ResumenEvaluaciones.xlsx");
    });
  }

  // GENERACION DE PDF'S
  async GenerarPDFEvaluacionFechas(action = "open", pdf: number) {
    const pdfMake = await this.ImportarPDF();
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
    let centrar: boolean = false;
    let headers = [{ text: "Sucursal", style: "tableHeader", alignment: 'center', }];
    let includeSubservicio = this.verSubservicio;
    let includeServicio = this.verServicio;
    let includeCajero = this.verCajero;
    let includeFecha = this.verFecha === "1";
    let includeMuyBueno = !this.opcionCuatro;

    if (includeSubservicio) {
      headers.push({ text: "Servicio", style: "tableHeader", alignment: 'center' });
      headers.push({ text: "Subservicio", style: "tableHeader", alignment: 'center' });
      centrar = true;
    } else if (includeServicio) {
      headers.push({ text: "Servicio", style: "tableHeader", alignment: 'center' });
      centrar = true;
    }

    if (includeCajero) {
      headers.push({ text: "Cajero(a)", style: "tableHeader", alignment: 'center' });
      centrar = true;
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
    var columnWidth = 'auto';
    if (centrar === false) {
      const totalColumns = headers.length;
      columnWidth = 100 / totalColumns + "%";
    }
    return {
      alignment: "center",
      table: {
        headerRows: 1,
        widths: headers.map(() => columnWidth),
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
    this.mostrar_resultado = false

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
          this.mostrar_resultado = true

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
          this.mostrar_resultado = true
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
    if (this.listaEvaluaciones.length != 0) {
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
    } else {
      this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
        timeOut: 6000,
      });
    }


    this.malRequestE = false;
    this.malRequestEPag = false;
    // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA


    if (this.configE.currentPage > 1) {
      this.configE.currentPage = 1;
    }
  }

  ExportarExcelEvaluacionTurno() {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet("Resumen Evaluaciones Turnos");
    this.imagen = workbook.addImage({
      base64: this.urlImagen,
      extension: "png",
    });
    worksheet.addImage(this.imagen, {
      tl: { col: 0, row: 0 },
      ext: { width: 220, height: 105 },
    });
    let nombreSucursal = this.ObtenerNombreSucursal(this.sucursalesSeleccionadas);
    // COMBINAR CELDAS
    worksheet.mergeCells("B1:H1");
    worksheet.mergeCells("B2:H2");
    worksheet.mergeCells("B3:H3");
    worksheet.mergeCells("B4:H4");
    worksheet.mergeCells("B5:H5");

    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'RESUMEN DE EVALUACIONES'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.desdeEvalT.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaEvalT.nativeElement.value
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

    // DEFINIR ENCABEZADOS DINAMICAMENTE
    let headers = ["No."];
    headers.push("SUCURSAL");
    if (this.verSubservicio) {
      headers.push("SERVICIO", "SUBSERVICIO");
    } else if (this.verServicio) {
      headers.push("SERVICIO");
    }
    if (this.verCajero) {
      headers.push("CAJERO(A)");
    }
    headers.push("INFORMACIÓN DEL USUARIO", "FECHA", "HORA", "TURNO", "CALIFICACIÓN");

    // AGREGAR ENCABEZADOS A LA HOJA
    let headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };

    // APLICAR BORDES A LOS ENCABEZADOS
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // AGREGAR DATOS DINAMICOS
    this.listaEvaluaciones.forEach((res: any, index: number) => {
      let row = [index + 1];
      row.push(res.nombreEmpresa);
      if (this.verSubservicio) {
        row.push(res.servicio, res.subservicio);
      } else if (this.verServicio) {
        row.push(res.servicio);
      }
      if (this.verCajero) {
        row.push(res.usua_nombre);
      }
      row.push(res.informacion, res.fecha, res.hora, res.turno, res.calificacion);
      // AGREGAR LA FILA A LA HOJA
      let newRow = worksheet.addRow(row);
      // APLICAR BORDES A CADA CELDA DE LA FILA
      newRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      // APLICAR ESTILO CEBRA (ALTERNANDO FONDO)
      if (index % 2 === 0) {
        newRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F2F2F2" }, // COLOR GRIS CLARO PARA FILAS IMPARES
          };
        });
      } else {
        newRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFF" }, // COLOR BLANCO PARA FILAS PARES
          };
        });
      }
    });

    // AJUSTAR EL ANCHO DE LAS COLUMNAS AUTOMATICAMENTE
    worksheet.columns.forEach(column => {
      column.width = 30;
    });

    // ESTILOS DE ENCABEZADO
    worksheet.getRow(6).eachCell((cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" }, // COLOR BLANCO PARA EL TEXTO
      };
      // HABILITAR FILTRO EN LA CELDA
      worksheet.autoFilter = {
        from: { row: 6, column: 1 },  // INICIO DEL FILTRO (FILA 6, COLUMNA 1)
        to: { row: 6, column: worksheet.columnCount } // FIN DEL FILTRO (ÚLTIMA COLUMNA)
      };
    });


    // GENERAR ARCHIVO EXCEL Y DESCARGARLO
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, "ResumenEvaluacionesTurnos.xlsx");
    });

  }

  async GenerarPDFTurnos(action = "open", pdf: number) {
    const pdfMake = await this.ImportarPDF();
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.desdeEvalT.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.hastaEvalT.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.DocumentarEvaluacionTurnos(
        fechaDesde,
        fechaHasta,
      );
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTANA EL PDF CREADO
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
  DocumentarEvaluacionTurnos(fechaDesde: any, fechaHasta: any) {
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
        { text: `RESUMEN DE EVALUACIONES POR TURNOS`, bold: true, fontSize: 14, alignment: 'center', margin: [0, -30, 0, 5] },
        { text: nombreSucursal?.toUpperCase(), bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        { text: `PERIODO DEL ${fechaDesde} HASTA ${fechaHasta}`, bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 5], },
        this.TratamientoInformacionEvaluacionTurnos(this.listaEvaluaciones),
      ],
      styles: {
        tableHeader: { fontSize: 8, bold: true, alignment: 'center', fillColor: this.p_color },
        itemsTable: { fontSize: 8, alignment: 'center' },
      }
    };
  }

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND SERVICIOS
  TratamientoInformacionEvaluacionTurnos(servicio: any[]) {
    var centrar: boolean = false;
    let headers = [{ text: "SUCURSAL", style: "tableHeader", alignment: 'center', }];
    let includeSubservicio = this.verSubservicio;
    let includeServicio = this.verServicio;
    let includeCajero = this.verCajero;

    if (includeSubservicio) {
      headers.push({ text: "SERVICIO", style: "tableHeader", alignment: 'center' });
      headers.push({ text: "SUBSERVICIO", style: "tableHeader", alignment: 'center' });
    } else if (includeServicio) {
      headers.push({ text: "SERVICIO", style: "tableHeader", alignment: 'center' });
    }

    if (includeCajero) {
      headers.push({ text: "CAJERO(A)", style: "tableHeader", alignment: 'center' });
    }

    headers.push(...[
      { text: "INFORMACIÓN DEL USUARIO", style: "tableHeader", alignment: 'center' },
      { text: "FECHA", style: "tableHeader", alignment: 'center' },
      { text: "HORA", style: "tableHeader", alignment: 'center' },
      { text: "TURNO", style: "tableHeader", alignment: 'center' },
      { text: "CALIFICACIÓN", style: "tableHeader", alignment: 'center' },
    ]);

    let bodyRows = servicio.map((res) => {
      let row = [{ style: "itemsTable", text: res.nombreEmpresa, alignment: 'center' }];

      if (includeSubservicio) {
        row.push({ style: "itemsTable", text: res.servicio, alignment: 'center' });
        row.push({ style: "itemsTable", text: res.subservicio, alignment: 'center' });
      } else if (includeServicio) {
        row.push({ style: "itemsTable", text: res.servicio, alignment: 'center' });
      }

      if (includeCajero) {
        row.push({ style: "itemsTable", text: res.usua_nombre, alignment: 'center' });
      }

      row.push(...[
        { style: "itemsTable", text: res.informacion, alignment: 'center' },
        { style: "itemsTable", text: res.fecha, alignment: 'center' },
        { style: "itemsTable", text: res.hora, alignment: 'center' },
        { style: "itemsTable", text: res.turno, alignment: 'center' },
        { style: "itemsTable", text: res.calificacion, alignment: 'center' },
      ]);

      return row;
    });
    var columnWidth = 'auto';
    if (centrar === false) {
      const totalColumns = headers.length;
      columnWidth = 100 / totalColumns + "%";
    }

    return {
      alignment: "center",
      table: {
        headerRows: 1,
        widths: headers.map(() => columnWidth),
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


  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }


}
