import {Component, OnInit, ViewChild, ElementRef, EventEmitter, Output,} from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { Utils } from "../../utils/util";

import { AuthenticationService } from "../../services/authentication.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { ServiceService } from "../../services/service.service";

import { cajero } from "../../models/cajero";
import { turno } from "../../models/turno";

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as XLSX from "xlsx";
import moment from "moment";

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

const EXCEL_EXTENSION = ".xlsx";

@Component({
  selector: "app-usuarios",
  templateUrl: "./usuarios.component.html",
  styleUrls: ["./usuarios.component.scss"],
})
export class UsuariosComponent implements OnInit {
  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("content") element: ElementRef;
  @ViewChild("fromDateTurnosFecha") fromDateTurnosFecha: ElementRef;
  @ViewChild("toDateTurnosFecha") toDateTurnosFecha: ElementRef;
  @ViewChild("fromDatePromAtencion") fromDatePromAtencion: ElementRef;
  @ViewChild("toDatePromAtencion") toDatePromAtencion: ElementRef;
  @ViewChild("fromDateAtencionUsua") fromDateAtencionUsua: ElementRef;
  @ViewChild("toDateAtencionUsua") toDateAtencionUsua: ElementRef;
  @ViewChild("fromDateUES") fromDateUES: ElementRef;
  @ViewChild("toDateUES") toDateUES: ElementRef;

  @ViewChild("codSucursal") codSucursal: ElementRef;
  @ViewChild("codSucursalEntradas") codSucursalEntradas: ElementRef;
  @ViewChild("codSucursalPromAtencion") codSucursalPromAtencion: ElementRef;
  @ViewChild("codSucursalAtencionUsua") codSucursalAtencionUsua: ElementRef;

  @ViewChild("codCajeroPromAtencion") codCajeroPromAtencion: ElementRef;
  @ViewChild("codCajeroAtencionUsua") codCajeroAtencionUsua: ElementRef;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  turno: turno[];
  cajero: cajero[];
  sucursales: any[];
  cajerosUsuarios: any = [];
  servicioTurnosFecha: any = [];
  servicioAtencionUsua: any = [];
  servicioPromAtencion: any = [];
  servicioEntradaSalida: any = [];

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesTPA: boolean = false;
  todasSucursalesTF: boolean = false;
  todasSucursalesES: boolean = false;
  todasSucursalesAU: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestTF: boolean = false;
  malRequestTFPag: boolean = false;
  malRequestTPA: boolean = false;
  malRequestTPPag: boolean = false;
  malRequestAU: boolean = false;
  malRequestAUPag: boolean = false;
  malRequestES: boolean = false;
  malRequestESPag: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configTF: any;
  configTP: any;
  configES: any;
  configAU: any;

  // FECHA CAPTURADA DEL SERVIDOR
  date: any;

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // MAXIMO DE ITEMS MOSTRADO DE TABLA EN PANTALLA
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: "Anterior",
    nextLabel: "Siguiente",
  };

  // IMAGEN LOGO
  urlImagen: string;
  nombreImagen: any[];

  @Output() menuMostrarOcultar: EventEmitter<any> = new EventEmitter();

  constructor(
    private serviceService: ServiceService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
    private imagenesService: ImagenesService
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    // TURNOS POR FECHA
    this.configTF = {
      id: "usuariosTF",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTurnosFecha.length,
    };
    // TIEMPO PROMEDIO DE ATENCION
    this.configTP = {
      id: "usuariosTP",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioPromAtencion.length,
    };
    // ENTRADAS Y SALIDAS DEL SISTEMA
    this.configES = {
      id: "usuariosES",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioEntradaSalida.length,
    };
    // ATENCION AL USUARIO
    this.configAU = {
      id: "usuariosAU",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioAtencionUsua.length,
    };
  }

  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  // TURNOS POR FECHA
  pageChangedTF(event: any) {
    this.configTF.currentPage = event;
  }
  // TIEMPO PROMEDIO DE ATENCION
  pageChangedTP(event: any) {
    this.configTP.currentPage = event;
  }
  // ENTRADAS Y SALIDAS AL SISTEMA
  pageChangedES(event: any) {
    this.configES.currentPage = event;
  }
  // ATENCION AL USUARIO
  pageChangedAU(event: any) {
    this.configAU.currentPage = event;
  }

  ngOnInit(): void {
    var f = moment();
    this.date = f.format("YYYY-MM-DD");

    // CARGAMOS COMPONENTES SELECTS HTML
    this.getCajeros("-1");
    this.getlastday();
    this.getSucursales();

    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");

    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestTFPag = true;
    this.malRequestTPPag = true;
    this.malRequestESPag = true;
    this.malRequestAUPag = true;

    // CARGAR LOGO PARA LOS REPORTES
    this.imagenesService.cargarImagen().then((result: string) => {
        this.urlImagen = result;
      }).catch((error) => {
        // SE INFORMA QUE NO SE PUDO CARGAR LA IMAGEN
        this.toastr.info("Error al cargar el logo, se utilizará la imagen por defecto", "Upss !!!.", {
          timeOut: 6000,
        });
        Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
          (result) => (this.urlImagen = result)
        );
      });
  }

  // CONSULTA DE LISTA DE CAJEROS
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe(
      (cajeros: any) => {
        this.cajerosUsuarios = cajeros.cajeros;
      },
      (error) => {
        if (error.status == 400) {
          this.cajerosUsuarios = [];
        }
      }
    );
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  // METODO PARA LLAMAR CONSULTA DE DATOS
  limpiar() {
    this.getCajeros("-1");
    this.getSucursales();
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl("/");
  }

  /** ********************************************************************************************************** **
   ** **                                     TIEMPO PROMEDIO DE ATENCION                                      ** **
   ** ********************************************************************************************************** **/

  buscarTurnosFecha() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateTurnosFecha.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosFecha.nativeElement.value
      .toString()
      .trim();
    var cod = this.codSucursal.nativeElement.value.toString().trim();

    this.serviceService
      .getfiltroturnosfechas(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (servicio: any) => {
          // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
          this.servicioTurnosFecha = servicio.turnos;
          this.malRequestTF = false;
          this.malRequestTFPag = false;

          // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
          if (this.configTF.currentPage > 1) {
            this.configTF.currentPage = 1;
          }

          // COMPROBACION DE LA SUCURSAL COONSULTADA
          this.todasSucursalesTF = this.comprobarBusquedaSucursales(cod);
        },
        (error) => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y BANDERAS CAMBIAN PARA QUITAR TABLA DE INTERFAZ
            this.servicioTurnosFecha = null;
            this.malRequestTF = true;
            this.malRequestTFPag = true;

            // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
            // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
            if (this.servicioTurnosFecha == null) {
              this.configTF.totalItems = 0;
            } else {
              this.configTF.totalItems = this.servicioTurnosFecha.length;
            }

            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configTF = {
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

  // SE OBTIENE LA FECHA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), "yyyy-MM-dd");
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, "yyyy-MM-dd");
  }

  /** ********************************************************************************************************** **
   ** **                                     TIEMPO PROMEDIO DE ATENCION                                      ** **
   ** ********************************************************************************************************** **/

  buscarTiempoPromedioAtencion() {
    // CAPTURA DE FECHA Y SELECT DE INTERFAZ
    var fechaDesde = this.fromDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    var cod = this.codCajeroPromAtencion.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalPromAtencion.nativeElement.value
      .toString()
      .trim();

    if (cod != "-1") {
      this.serviceService
        .getturnosF(fechaDesde, fechaHasta, parseInt(cod))
        .subscribe(
          (servicio: any) => {
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioPromAtencion = servicio.turnos;
            this.malRequestTPA = false;
            this.malRequestTPPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTP.currentPage > 1) {
              this.configTP.currentPage = 1;
            }
            // COMPROBACION DE LA SUCURSAL COONSULTADA
            this.todasSucursalesTPA =
              this.comprobarBusquedaSucursales(codSucursal);
          },
          (error) => {
            if (error.status == 400) {
              // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
              this.servicioPromAtencion = null;
              this.malRequestTPA = true;
              this.malRequestTPPag = true;
              // COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS
              // CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
              if (this.servicioPromAtencion == null) {
                this.configTP.totalItems = 0;
              } else {
                this.configTP.totalItems = this.servicioPromAtencion.length;
              }
              // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
              this.configTP = {
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
      // SI SE SELECCIONA EL ELEMENTO POR DEFECTO DE SELECT SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES DE INTERFAZ
      // SE VACIA VARIABLE DE CONSULTA
      this.servicioPromAtencion = null;
      this.malRequestTPA = true;
      this.malRequestTPPag = true;
      // SI VARIABLA DE CONSULTA ES NULA O VACIA, SE SETEA ELEMENTOS DE PAGINACION
      if (this.servicioPromAtencion == null) {
        this.configTP.totalItems = 0;
      } else {
        this.configTP.totalItems = this.servicioPromAtencion.length;
      }
      this.configTP = {
        itemsPerPage: this.MAX_PAGS,
        currentPage: 1,
      };
    }
  }

  buscarAtencionUsuario() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateAtencionUsua.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateAtencionUsua.nativeElement.value
      .toString()
      .trim();
    var cod = this.codCajeroAtencionUsua.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalAtencionUsua.nativeElement.value
      .toString()
      .trim();

    if (cod != "-1") {
      this.serviceService
        .getatencionusuarios(fechaDesde, fechaHasta, parseInt(cod))
        .subscribe(
          (servicio: any) => {
            //Si se consulta correctamente se guarda en variable y setea banderas de tablas
            this.servicioAtencionUsua = servicio.turnos;
            this.malRequestAU = false;
            this.malRequestAUPag = false;
            //Seteo de paginacion cuando se hace una nueva busqueda
            if (this.configAU.currentPage > 1) {
              this.configAU.currentPage = 1;
            }

            this.todasSucursalesAU =
              this.comprobarBusquedaSucursales(codSucursal);
          },
          (error) => {
            if (error.status == 400) {
              //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
              this.servicioAtencionUsua = null;
              this.malRequestAU = true;
              this.malRequestAUPag = true;
              //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
              //caso contrario se setea la cantidad de elementos
              if (this.servicioAtencionUsua == null) {
                this.configAU.totalItems = 0;
              } else {
                this.configAU.totalItems = this.servicioAtencionUsua.length;
              }
              this.configAU = {
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
    } else {
      //Si se selecciona el elemento por defecto de select se setea banderas para que tablas no sean visisbles de interfaz
      //Se vacia variable de consulta
      this.servicioAtencionUsua = null;
      this.malRequestAU = true;
      this.malRequestAUPag = true;
      //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
      //caso contrario se setea la cantidad de elementos
      if (this.servicioAtencionUsua == null) {
        this.configAU.totalItems = 0;
      } else {
        this.configAU.totalItems = this.servicioAtencionUsua.length;
      }
      this.configAU = {
        itemsPerPage: this.MAX_PAGS,
        currentPage: 1,
      };
    }
  }

  leerEntradasSalidasSistema() {
    //captura de fechas para proceder con la busqueda
    var fechaDesde = this.fromDateUES.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateUES.nativeElement.value.toString().trim();
    var cod = this.codSucursalEntradas.nativeElement.value.toString().trim();
    let codSucursal = this.codSucursalEntradas.nativeElement.value
      .toString()
      .trim();

    this.serviceService
      .getentradassalidasistema(fechaDesde, fechaHasta, parseInt(cod))
      .subscribe(
        (servicio: any) => {
          //Si se consulta correctamente se guarda en variable y setea banderas de tablas
          this.servicioEntradaSalida = servicio.turnos;
          this.malRequestES = false;
          this.malRequestESPag = false;
          //Seteo de paginacion cuando se hace una nueva busqueda
          if (this.configES.currentPage > 1) {
            this.configES.currentPage = 1;
          }
          this.todasSucursalesES =
            this.comprobarBusquedaSucursales(codSucursal);
        },
        (error) => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioEntradaSalida = null;
            this.malRequestES = true;
            this.malRequestESPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioEntradaSalida == null) {
              this.configES.totalItems = 0;
            } else {
              this.configES.totalItems = this.servicioEntradaSalida.length;
            }
            this.configES = {
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

  obtenerNombreSucursal(cod: string) {
    if (cod == "-1") {
      return "Todas las sucursales";
    } else {
      let nombreSucursal = this.sucursales.find(
        (sucursal) => sucursal.empr_codigo == cod
      ).empr_nombre;
      return nombreSucursal;
    }
  }

  exportarAExcelEntradaSalida() {
    let cod = this.codSucursal.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesES) {
      for (let i = 0; i < this.servicioEntradaSalida.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioEntradaSalida[i].nombreEmpresa,
          Usuario: this.servicioEntradaSalida[i].Usuario,
          "Fecha y hora": this.servicioEntradaSalida[i].fecha,
          Razón: this.servicioEntradaSalida[i].Razon,
        });
      }
    } else {
      for (let i = 0; i < this.servicioEntradaSalida.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioEntradaSalida[i].Usuario,
          "Hora Registrada": this.servicioEntradaSalida[i].fecha,
          Razón: this.servicioEntradaSalida[i].Razon,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioEntradaSalida[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Entradas-Salidas");
    XLSX.writeFile(
      wb,
      "Entradas y salidas - " +
        nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  ExportTOExcelTurnosFecha() {
    let cod = this.codSucursal.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesTF) {
      for (let i = 0; i < this.servicioTurnosFecha.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioTurnosFecha[i].nombreEmpresa,
          Usuario: this.servicioTurnosFecha[i].Usuario,
          Servicio: this.servicioTurnosFecha[i].Servicio,
          Fecha: this.servicioTurnosFecha[i].Fecha,
          Atendidos: this.servicioTurnosFecha[i].Atendidos,
          "No Atendidos": this.servicioTurnosFecha[i].No_Atendidos,
          Total: this.servicioTurnosFecha[i].Total,
        });
      }
    } else {
      for (let i = 0; i < this.servicioTurnosFecha.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioTurnosFecha[i].Usuario,
          Servicio: this.servicioTurnosFecha[i].Servicio,
          Fecha: this.servicioTurnosFecha[i].Fecha,
          Atendidos: this.servicioTurnosFecha[i].Atendidos,
          "No Atendidos": this.servicioTurnosFecha[i].No_Atendidos,
          Total: this.servicioTurnosFecha[i].Total,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioTurnosFecha[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Turnos Fecha");
    XLSX.writeFile(
      wb,
      "Turnos por fecha - " +
        nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  exportarAExcelPromAtencion() {
    let cod = this.codSucursalPromAtencion.nativeElement.value
      .toString()
      .trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    let tamanos = [];
    if (this.todasSucursalesTPA) {
      for (let i = 0; i < this.servicioPromAtencion.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioPromAtencion[i].nombreEmpresa,
          Usuario: this.servicioPromAtencion[i].Nombre,
          Servicio: this.servicioPromAtencion[i].Servicio,
          Tiempo: this.servicioPromAtencion[i].Promedio,
          Turnos: this.servicioPromAtencion[i].Turnos,
        });
      }
      tamanos = [this.servicioPromAtencion[0].nombreEmpresa];
    } else {
      for (let i = 0; i < this.servicioPromAtencion.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioPromAtencion[i].Nombre,
          Servicio: this.servicioPromAtencion[i].Servicio,
          Tiempo: this.servicioPromAtencion[i].Promedio,
          Turnos: this.servicioPromAtencion[i].Turnos,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioPromAtencion[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Promedio");
    XLSX.writeFile(
      wb,
      "Promedio de atencion - " +
        nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  exportarAExcelAtencionUsuario() {
    let cod = this.codSucursal.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesAU) {
      for (let i = 0; i < this.servicioAtencionUsua.length; i++) {
        jsonServicio.push({
          Sucursal: this.servicioAtencionUsua[i].nombreEmpresa,
          Usuario: this.servicioAtencionUsua[i].Nombre,
          Servicio: this.servicioAtencionUsua[i].Servicio,
          Atendidos: this.servicioAtencionUsua[i].Atendidos,
        });
      }
    } else {
      for (let i = 0; i < this.servicioAtencionUsua.length; i++) {
        jsonServicio.push({
          Usuario: this.servicioAtencionUsua[i].Nombre,
          Servicio: this.servicioAtencionUsua[i].Servicio,
          Atendidos: this.servicioAtencionUsua[i].Atendidos,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioAtencionUsua[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {
      // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Atencion");
    XLSX.writeFile(
      wb,
      "Atencion al usuario - " +
        nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION
    );
  }

  //----GENERACION DE PDF'S----
  generarPdfTurnosFecha(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateTurnosFecha.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosFecha.nativeElement.value
      .toString()
      .trim();

    var cod = this.codSucursal.nativeElement.value.toString().trim();

    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentturnosfecha(
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
  getDocumentturnosfecha(fechaDesde, fechaHasta, cod) {
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
              height: 45,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Turno por Fecha ",
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
        this.CampoDetalle(this.servicioTurnosFecha), //Definicion de funcion delegada para setear informacion de tabla del PDF
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
        tableMargin: { margin: [0, 10, 0, 20], alignment: "center" },
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

  //Funcion para llenar la tabla con la consulta realizada al backend
  CampoDetalle(servicio: any[]) {
    if (this.todasSucursalesTF) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],

          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Usuario", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No Atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Fecha },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto"],

          body: [
            [
              { text: "Usuario", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No Atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Fecha },
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

  generarPdfPromAtencion(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDatePromAtencion.nativeElement.value
      .toString()
      .trim();

    var cod = this.codSucursalPromAtencion.nativeElement.value
      .toString()
      .trim();

    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentpromatencion(
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
  getDocumentpromatencion(fechaDesde, fechaHasta, cod) {
    //Obtiene fecha actual
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
              height: 45,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Tiempo Promedio Atención",
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
        this.Campopromedioatencion(this.servicioPromAtencion), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF
  Campopromedioatencion(servicio: any[]) {
    if (this.todasSucursalesTPA) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Usuario", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Tiempo", style: "tableHeader" },
              { text: "Turnos", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Nombre },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Promedio },
                { style: "itemsTable", text: res.Turnos },
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
          alignment: "center",
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Usuario", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Tiempo", style: "tableHeader" },
              { text: "Turnos", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Nombre },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Promedio },
                { style: "itemsTable", text: res.Turnos },
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

  generarPdfEntradaSalida(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateUES.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateUES.nativeElement.value.toString().trim();
    var cod = this.codSucursalEntradas.nativeElement.value.toString().trim();

    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEntradasSalidas(
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
  getDocumentEntradasSalidas(fechaDesde, fechaHasta, cod) {
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
              height: 45,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Entradas y Salidas al Sistema",
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
        this.entradassalidassistema(this.servicioEntradaSalida), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF
  entradassalidassistema(servicio: any[]) {
    if (this.todasSucursalesES) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Usuario", style: "tableHeader" },
              { text: "Fecha y hora", style: "tableHeader" },
              { text: "Razón", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Razon },
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
          alignment: "center",
          widths: ["*", "auto", "auto"],
          body: [
            [
              { text: "Usuario", style: "tableHeader" },
              { text: "Fecha y hora", style: "tableHeader" },
              { text: "Razón", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.fecha },
                { style: "itemsTable", text: res.Razon },
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

  generarPdfAtencionUsuario(action = "open", pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fechaDesde = this.fromDateAtencionUsua.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateAtencionUsua.nativeElement.value
      .toString()
      .trim();
    var cod = this.codSucursalAtencionUsua.nativeElement.value
      .toString()
      .trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentAtencionUsuario(
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

  //Funcion delegada para seteo de información en estructura
  getDocumentAtencionUsuario(fechaDesde, fechaHasta, cod) {
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
              height: 45,
            },
            {
              width: "*",
              alignment: "center",
              text: "Reporte - Atención al Usuario",
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
          text: "Periodo de " + fechaDesde + " Hasta " + fechaHasta,
        },
        this.atencionusuario(this.servicioAtencionUsua), //Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF
  atencionusuario(servicio: any[]) {
    if (this.todasSucursalesAU) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          alignment: "center",
          widths: ["*", "*", "auto", "auto"],
          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Nombre", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Nombre },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Atendidos },
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
          alignment: "center",
          widths: ["*", "auto", "auto"],
          body: [
            [
              { text: "Nombre", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Nombre },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.Atendidos },
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
