import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { Utils } from "../../utils/util";
import { AuthenticationService } from "../../services/authentication.service";
import { ImagenesService } from "../../shared/imagenes.service";
import { ServiceService } from "../../services/service.service";
import { cajero } from "../../models/cajero";
import { turno } from "../../models/turno";
import { Chart } from "chart.js";
import { ChangeDetectorRef } from '@angular/core';

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import * as pdfMake from "pdfmake/build/pdfmake";
import ExcelJS, { FillPattern } from "exceljs";
import * as FileSaver from 'file-saver';


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
  private imagen: any;


  private bordeCompleto!: Partial<ExcelJS.Borders>;
  private bordeGrueso!: Partial<ExcelJS.Borders>;
  private fillAzul!: FillPattern;
  private fontTitulo!: Partial<ExcelJS.Font>;
  private fontHipervinculo!: Partial<ExcelJS.Font>;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild("content") element: ElementRef;
  @ViewChild("fromDateTurnosFecha") fromDateTurnosFecha: ElementRef;
  @ViewChild("toDateTurnosFecha") toDateTurnosFecha: ElementRef;
  @ViewChild("fromDateTurnosTotalFecha") fromDateTurnosTotalFecha: ElementRef;
  @ViewChild("toDateTurnosTotalFecha") toDateTurnosTotalFecha: ElementRef;
  @ViewChild("fromDateTurnosMeta") fromDateTurnosMeta: ElementRef;
  @ViewChild("toDateTurnosMeta") toDateTurnosMeta: ElementRef;
  @ViewChild("fromDatePromAtencion") fromDatePromAtencion: ElementRef;
  @ViewChild("toDatePromAtencion") toDatePromAtencion: ElementRef;
  @ViewChild("fromDateTiempoAtencion") fromDateTiempoAtencion: ElementRef;
  @ViewChild("toDateTiempoAtencion") toDateTiempoAtencion: ElementRef;
  @ViewChild("fromDateAtencionUsua") fromDateAtencionUsua: ElementRef;
  @ViewChild("toDateAtencionUsua") toDateAtencionUsua: ElementRef;
  @ViewChild("fromDateUES") fromDateUES: ElementRef;
  @ViewChild("toDateUES") toDateUES: ElementRef;

  @ViewChild("horaInicioTF") horaInicioTF: ElementRef;
  @ViewChild("horaFinTF") horaFinTF: ElementRef;
  @ViewChild("horaInicioTTF") horaInicioTTF: ElementRef;
  @ViewChild("horaFinTTF") horaFinTTF: ElementRef;
  @ViewChild("horaInicioTM") horaInicioTM: ElementRef;
  @ViewChild("horaFinTM") horaFinTM: ElementRef;
  @ViewChild("horaInicioTPA") horaInicioTPA: ElementRef;
  @ViewChild("horaFinTPA") horaFinTPA: ElementRef;
  @ViewChild("horaInicioTA") horaInicioTA: ElementRef;
  @ViewChild("horaFinTA") horaFinTA: ElementRef;
  @ViewChild("horaInicioAU") horaInicioAU: ElementRef;
  @ViewChild("horaFinAU") horaFinAU: ElementRef;
  @ViewChild("horaInicioES") horaInicioES: ElementRef;
  @ViewChild("horaFinES") horaFinES: ElementRef;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  turno: turno[];
  cajero: cajero[];
  sucursales: any[];
  serviciosServs: any = [];
  subservicios: any[];
  mostrar_resultado = false;
  chart: any;

  orientacion: string = "portrait";


  onSelectionChange() {
    this.mostrar_resultado = false;
    if (!this.serviciosSeleccionadas || this.serviciosSeleccionadas.length === 0) {
      this.mostrarSubservicios = false;
      this.selectAll('serviciosSeleccionadas');
    }
  }

  onSelectionChangeSucursal() {
    this.mostrar_resultado = false;
    if (!this.sucursalesSeleccionadas || this.sucursalesSeleccionadas.length === 0) {
      this.mostrarCajeros = false;
      this.mostrarServicios = false;
      this.selectAll('sucursalesSeleccionadas');
    }
  }

  mostrarServicios: boolean = false;
  mostrarSubservicios: boolean = false;

  cajerosUsuarios: any = [];
  servicioTurnosFecha: any = [];
  servicioTurnosTotalFecha: any = [];
  suma: number = 0;
  servicioTurnosMeta: any = [];
  servicioAtencionUsua: any = [];
  servicioPromAtencion: any = [];
  servicioTiempoAtencion: any = [];
  servicioEntradaSalida: any = [];

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursalesTPA: boolean = false;
  todasSucursalesTA: boolean = false;
  todasSucursalesTF: boolean = false;
  todasServiciosTF: boolean = false;

  todasSucursalesTTF: boolean = false;
  todasSucursalesTM: boolean = false;
  todasSucursalesES: boolean = false;
  todasSucursalesAU: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestTF: boolean = false;
  malRequestTTF: boolean = false;
  malRequestTM: boolean = false;
  malRequestTFPag: boolean = false;
  malRequestTTFPag: boolean = false;
  malRequestTMPag: boolean = false;
  malRequestTPA: boolean = false;
  malRequestTPPag: boolean = false;
  malRequestTA: boolean = false;
  malRequestTAPag: boolean = false;
  malRequestAU: boolean = false;
  malRequestAUPag: boolean = false;
  malRequestES: boolean = false;
  malRequestESPag: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configTF: any;
  configTTF: any;
  configTM: any;
  configTP: any;
  configTA: any;
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

  // OPCIONES MULTIPLES
  allSelected: boolean = false;
  selectedItems: string[] = [];
  sucursalesSeleccionadas: string[] = [];
  serviciosSeleccionadas: string[] = [];
  sub_serviciosSeleccionadas: string[] = [];

  seleccionMultiple: boolean = false;
  seleccionMultipleServicios: boolean = false;
  seleccionMultipleSubServicios: boolean = false;

  //MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  //Variables de informacion
  valor: number;
  marca: string = "FullTime Tickets";
  horas: number[] = [];


  @Output() menuMostrarOcultar: EventEmitter<any> = new EventEmitter();

  constructor(
    private imagenesService: ImagenesService,
    private serviceService: ServiceService,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthenticationService,
    public datePipe: DatePipe,
    private cdRef: ChangeDetectorRef
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    // TURNOS POR FECHA
    this.configTF = {
      id: "usuariosTF",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTurnosFecha.length,
    };
    // TURNOS TOTALES POR FECHA
    this.configTTF = {
      id: "usuariosTTF",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTurnosTotalFecha.length,
    };
    // TURNOS META
    this.configTM = {
      id: "usuariosTM",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTurnosMeta.length,
    };
    // TIEMPO PROMEDIO DE ATENCION
    this.configTP = {
      id: "usuariosTP",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioPromAtencion.length,
    };
    // TIEMPO DE ATENCION POR TURNOS
    this.configTA = {
      id: "usuariosTA",
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioTiempoAtencion.length,
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

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }

  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  // TURNOS POR FECHA
  pageChangedTF(event: any) {
    this.configTF.currentPage = event;
  }
  // TURNOS TOTAL POR FECHA
  pageChangedTTF(event: any) {
    this.configTTF.currentPage = event;
  }
  // TURNOS META
  pageChangedTM(event: any) {
    this.configTM.currentPage = event;
  }
  // TIEMPO PROMEDIO DE ATENCION
  pageChangedTP(event: any) {
    this.configTP.currentPage = event;
  }
  // TIEMPO DE ATENCION POR TURNOS
  pageChangedTA(event: any) {
    this.configTA.currentPage = event;
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
    this.getlastday();
    this.getSucursales();
    this.getMeta();
    this.getMarca();

    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem("loggedUser");

    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestTFPag = true;
    this.malRequestTTFPag = true;
    this.malRequestTMPag = true;
    this.malRequestTPPag = true;
    this.malRequestTAPag = true;
    this.malRequestESPag = true;
    this.malRequestAUPag = true;

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

    this.bordeGrueso = {
      top: { style: "medium" as ExcelJS.BorderStyle },
      left: { style: "medium" as ExcelJS.BorderStyle },
      bottom: { style: "medium" as ExcelJS.BorderStyle },
      right: { style: "medium" as ExcelJS.BorderStyle },
    };

    this.fillAzul = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F81BD" }, // Azul claro
    };

    this.fontTitulo = { bold: true, size: 12, color: { argb: "FFFFFF" } };
    this.fontHipervinculo = { color: { argb: "0000FF" }, underline: true };
  }

  selectAll(opcion: string) {
    this.mostrar_resultado = false
    switch (opcion) {
      case 'allSelected':
        this.allSelected = !this.allSelected;
        break;
      case 'todasSucursalesTF':
        this.todasSucursalesTF = !this.todasSucursalesTF;
        this.todasSucursalesTF ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : null;
        break;
      case 'todasSucursalesTTF':
        this.todasSucursalesTTF = !this.todasSucursalesTTF;
        this.todasSucursalesTTF ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : null;
        break;
      case 'todasSucursalesTM':
        this.todasSucursalesTM = !this.todasSucursalesTM;
        this.todasSucursalesTM ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : null;
        break;
      case 'todasSucursalesES':
        this.todasSucursalesES = !this.todasSucursalesES;
        this.todasSucursalesES ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      case 'todasSucursalesTPA':
        this.todasSucursalesTPA = !this.todasSucursalesTPA;
        this.todasSucursalesTPA ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : null;
        break;
      case 'todasSucursalesTA':
        this.todasSucursalesTA = !this.todasSucursalesTA;
        this.todasSucursalesTA ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : null;
        break;
      case 'todasSucursalesAU':
        this.todasSucursalesAU = !this.todasSucursalesAU;
        this.todasSucursalesAU ? this.getCajeros(this.sucursalesSeleccionadas) : null;
        break;
      case 'sucursalesSeleccionadas':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        this.sucursalesSeleccionadas.length > 0 ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : this.cajerosUsuarios = [], this.serviciosServs = [];
        break;
      case 'todasServiciosTF':
        this.todasServiciosTF = !this.todasServiciosTF;
        this.serviciosSeleccionadas.length > 0 ? (this.getSub_servicios(this.serviciosSeleccionadas)) : null;
        break;
      case 'serviciosSeleccionadas':
        this.seleccionMultipleServicios = this.serviciosSeleccionadas.length > 1;
        this.serviciosSeleccionadas.length > 0 ? (this.getSub_servicios(this.serviciosSeleccionadas)) : this.subservicios = [];
        break;
      case 'todasSubServiciosTF':
        this.seleccionMultipleSubServicios = !this.seleccionMultipleSubServicios;
        break;


      default:
        break;
    }
  }

  getMeta() {
    this.serviceService.getMeta().subscribe((valor: any) => {
      this.valor = valor.valor;
    });
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

  // CONSULTA DE LISTA DE CAJEROS
  getCajeros(sucursal: any) {
    this.serviceService.getCajerosSucursalEstado(sucursal, this.estadoUsuario).subscribe(
      (cajeros: any) => {
        this.cajerosUsuarios = cajeros.cajeros;
        this.mostrarCajeros = true;
      },
      (error) => {
        if (error.status == 400) {
          this.cajerosUsuarios = [];
          this.mostrarCajeros = false;
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


  getSub_servicios(servicio: any) {
    this.serviceService.getAllSubservicios(servicio).subscribe((subservicios: any) => {
      console.log("entro a buscacr subservicio")

      this.subservicios = subservicios.servicios;
      this.mostrarSubservicios = true;
    },
      (error) => {
        console.log("entro a error de subservicio")
        if (error.status == 400) {
          this.subservicios = [];
          this.mostrarSubservicios = false;
        }
      });


  }

  // METODO PARA SELCCIONAR ESTADO DE USUARIOS
  estadoUsuario: number = 2;

  CambiarEstado(estado: number) {
    this.mostrar_resultado = false
    this.estadoUsuario = estado;
    this.limpiar();
  }


  // METODO PARA LLAMAR CONSULTA DE DATOS
  limpiar() {
    this.mostrar_resultado = false

    this.cajerosUsuarios = [];
    this.mostrarCajeros = false;
    this.serviciosServs = [];
    this.mostrarServicios = false;
    this.subservicios = []
    this.mostrarSubservicios = false;
    this.selectedItems = [];
    this.allSelected = false;
    this.todasSucursalesTPA = false;
    this.todasSucursalesTA = false;
    this.todasSucursalesTF = false;
    this.todasSucursalesTTF = false;
    this.todasSucursalesTM = false;
    this.todasSucursalesES = false;
    this.todasSucursalesAU = false;
    this.seleccionMultiple = false;
    this.todasServiciosTF = false;
    this.seleccionMultipleServicios = false;
    this.seleccionMultipleSubServicios = false;
    this.sucursalesSeleccionadas = [];
    this.serviciosSeleccionadas = [];
    this.sub_serviciosSeleccionadas = []

  }

  LimpiarFormularios() {
    this.limpiar();
    this.estadoUsuario = 2;
    const activo2 = document.getElementById('activo2') as HTMLInputElement;
    const activo3 = document.getElementById('activo3') as HTMLInputElement;
    const activo4 = document.getElementById('activo4') as HTMLInputElement;
    const activo5 = document.getElementById('activo5') as HTMLInputElement;
    const activo6 = document.getElementById('activo6') as HTMLInputElement;

    activo2.checked = true;
    activo3.checked = true;
    activo4.checked = true;
    activo5.checked = true;
    activo6.checked = true;

  }

  verFecha: string = '1';
  CambiarFecha(opcion: string) {
    this.verFecha = opcion;
    this.mostrar_resultado = false
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
   ** **                                     TURNOS TOTALES POR FECHA                                         ** **
   ** ********************************************************************************************************** **/
  porcentajeTotal: any;

  buscarTurnosTotalFecha() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateTurnosTotalFecha.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosTotalFecha.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioTTF.nativeElement.value;
    let horaFin = this.horaFinTTF.nativeElement.value;

    var datoCajero: any = '0N';
    if (this.selectedItems.length != 0) {
      datoCajero = this.selectedItems;
    }

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService
        .getturnostotalfechas(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas, datoCajero, this.serviciosSeleccionadas, this.sub_serviciosSeleccionadas, this.estadoUsuario, this.verFecha)
        .subscribe(
          (servicio: any) => {
            //this.mostrar_resultado = true;
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABfLE Y SETEA BANDERAS DE TABLAS
            this.servicioTurnosTotalFecha = servicio.turnos;
            console.log("ver servicioTurnosTotalFecha", this.servicioTurnosTotalFecha)
            let sumaTotal: number = 0;
            let totalP = servicio.turnos.map((res) => res.PORCENTAJE);
            let totalPorc: number = 0;

            this.servicioTurnosTotalFecha.forEach(elemento => {
              sumaTotal += Number(elemento.Total);
            });
            this.suma = sumaTotal;
            for (var i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
              totalPorc = totalPorc + Number(totalP[i]);
            }
            this.porcentajeTotal = Math.round(totalPorc);

            this.malRequestTTF = false;
            this.malRequestTTFPag = false;

            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTTF.currentPage > 1) {
              this.configTTF.currentPage = 1;
            }


            // MAPEO DE DATOS PARA IMPRIMIR EN GRAFICO
            let Nombres = this.servicioTurnosTotalFecha.map((res) => `${res.Servicio}`);
            let totales = this.servicioTurnosTotalFecha.map((res) => res.Total);
            let atendidos = this.servicioTurnosTotalFecha.map((res) => res.Atendidos);
            let noAtendidos = this.servicioTurnosTotalFecha.map((res) => res.No_Atendidos);

            // SETEO DE CADA GRUPO DE DATOS
            var atendidosData = {
              label: "Atendidos",
              data: atendidos,
              backgroundColor: "rgba(0, 99, 132, 0.6)",
            };
            var noAtendidosData = {
              label: "No atendidos",
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
            if (this.chart) {
              this.chart.destroy();
            }

            this.mostrar_resultado = true;
            this.cdRef.detectChanges(); // Forzar actualización del DOM

            // ESPERAR A QUE EL DIV SE RENDERICE ANTES DE CREAR EL GRÁFICO
            setTimeout(() => {
              if (this.chart) {
                this.chart.destroy();
              }

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
                  responsive: true,
                },
              });

              console.log("ver data del grafico: ", this.chart);
            }, 0); // Pequeña espera para permitir que 

          },
          (error) => {
            if (error.status == 400) {

              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }

    /*
    if (this.chart != undefined || this.chart != null) {
      this.chart.destroy();
    }
      */
  }

  /** ********************************************************************************************************** **
   ** **                                           TURNOS META                                                ** **
   ** ********************************************************************************************************** **/

  buscarTurnosMeta() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fechaDesde = this.fromDateTurnosMeta.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosMeta.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioTM.nativeElement.value;
    let horaFin = this.horaFinTM.nativeElement.value;

    var datoCajero: any = '0N';

    if (this.selectedItems.length != 0) {
      datoCajero = this.selectedItems;
    }

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService
        .getturnosMeta(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas, datoCajero, this.serviciosSeleccionadas, this.sub_serviciosSeleccionadas, this.estadoUsuario)
        .subscribe(
          (servicio: any) => {
            console.log("ver numero de turnos meta: ", servicio.turnos.length)
            this.mostrar_resultado = true;
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioTurnosMeta = servicio.turnos;
            this.malRequestTM = false;
            this.malRequestTMPag = false;

            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTM.currentPage > 1) {
              this.configTM.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {

              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  /** ********************************************************************************************************** **
   ** **                                     TIEMPO PROMEDIO DE ATENCION                                      ** **
   ** ********************************************************************************************************** **/

  buscarTiempoPromedioAtencion() {
    console.log("entra a este metodo")

    // CAPTURA DE FECHA Y SELECT DE INTERFAZ
    var fechaDesde = this.fromDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDatePromAtencion.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioTPA.nativeElement.value;
    let horaFin = this.horaFinTPA.nativeElement.value;

    var datoCajero: any = '0N';
    if (this.selectedItems.length != 0) {
      datoCajero = this.selectedItems;
    }
    console.log("ver datoCajero: ", datoCajero)

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService
        .getturnosF(fechaDesde, fechaHasta, horaInicio, horaFin, datoCajero, this.sucursalesSeleccionadas,
          this.serviciosSeleccionadas, this.sub_serviciosSeleccionadas, this.estadoUsuario, this.verFecha)
        .subscribe(
          (servicio: any) => {
            console.log("ver registros de tiempo", servicio.turnos)
            this.mostrar_resultado = true
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioPromAtencion = servicio.turnos;
            this.malRequestTPA = false;
            this.malRequestTPPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTP.currentPage > 1) {
              this.configTP.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
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

  /** ********************************************************************************************************** **
   ** **                                     TIEMPO DE ATENCION POR TURNOS                                    ** **
   ** ********************************************************************************************************** **/

  buscarTiempoAtencion() {
    // CAPTURA DE FECHA Y SELECT DE INTERFAZ
    var fechaDesde = this.fromDateTiempoAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTiempoAtencion.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioTA.nativeElement.value;
    let horaFin = this.horaFinTA.nativeElement.value;

    var datoCajero: any = '0N';

    if (this.selectedItems.length != 0) {
      datoCajero = this.selectedItems;
    }

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService
        .getturnosAtencion(fechaDesde, fechaHasta, horaInicio, horaFin, datoCajero, this.sucursalesSeleccionadas, this.serviciosSeleccionadas, this.sub_serviciosSeleccionadas, this.estadoUsuario)
        .subscribe(
          (servicio: any) => {
            console.log("numero de resultados de buscarTiempoAtencion: ", servicio.turnos.length)
            this.mostrar_resultado = true;
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioTiempoAtencion = servicio.turnos;
            this.malRequestTA = false;
            this.malRequestTAPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configTA.currentPage > 1) {
              this.configTA.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {

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
      this.servicioTiempoAtencion = null;
      this.malRequestTA = true;
      this.malRequestTAPag = true;
      // SI VARIABLA DE CONSULTA ES NULA O VACIA, SE SETEA ELEMENTOS DE PAGINACION
      if (this.servicioTiempoAtencion == null) {
        this.configTA.totalItems = 0;
      } else {
        this.configTA.totalItems = this.servicioTiempoAtencion.length;
      }
      this.configTA = {
        itemsPerPage: this.MAX_PAGS,
        currentPage: 1,
      };
    }
  }


  leerEntradasSalidasSistema() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    let fechaDesde = this.fromDateUES.nativeElement.value.toString().trim();
    let fechaHasta = this.toDateUES.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioES.nativeElement.value;
    let horaFin = this.horaFinES.nativeElement.value;

    var datoCajero: any = '0N';

    if (this.selectedItems.length != 0) {
      datoCajero = this.selectedItems;
    }

    if (this.sucursalesSeleccionadas.length !== 0 && this.selectedItems.length !== 0) {
      this.serviceService
        .getentradassalidasistema(fechaDesde, fechaHasta, horaInicio, horaFin, this.sucursalesSeleccionadas, datoCajero, this.estadoUsuario)
        .subscribe(
          (servicio: any) => {
            this.mostrar_resultado = true;
            // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
            this.servicioEntradaSalida = servicio.turnos;
            this.malRequestES = false;
            this.malRequestESPag = false;
            // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
            if (this.configES.currentPage > 1) {
              this.configES.currentPage = 1;
            }
          },
          (error) => {
            if (error.status == 400) {
              // SE INFORMA QUE NO SE ENCONTRARON REGISTROS
              this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
                timeOut: 6000,
              });
            }
          }
        );
    }
  }

  obtenerNombreSucursal(sucursales: any) {
    const listaSucursales = sucursales;
    let nombreSucursal = "";

    listaSucursales.forEach(elemento => {
      const cod = elemento;
      if (cod == "-1") {
        nombreSucursal = "Reporte General";
        return;
      }
      const nombre = this.sucursales.find(
        (sucursal) => sucursal.empr_codigo == cod
      ).empr_nombre;
      nombreSucursal += `${nombre} `;
    });
    return nombreSucursal;
  }

  // EN EL CONTROLADOR DE ANGULAR
  convertirObjetoACadena(objeto: any) {
    return objeto.toString();
  };

  // Función para sumar un día a la fecha
  addOneDay(date: Date): Date {
    //date.setDate(date.getDate() + 1);
    return date;
  }

  async exportarAExcelEntradaSalida() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Entradas - salidas");
    this.imagen = workbook.addImage({
      base64: this.urlImagen,
      extension: "png",
    });

    worksheet.addImage(this.imagen, {
      tl: { col: 0, row: 0 },
      ext: { width: 220, height: 105 },
    });

    // COMBINAR CELDAS
    worksheet.mergeCells("B1:H1");
    worksheet.mergeCells("B2:H2");
    worksheet.mergeCells("B3:H3");
    worksheet.mergeCells("B4:H4");
    worksheet.mergeCells("B5:H5");

    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'REPORTE - ENTRADAS-SALIDAS'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fromDateUES.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateUES.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "Periodo de " + fechaDesde + " hasta " + fechaHasta;

    // APLICAR ESTILO DE CENTRADO Y NEGRITA A LAS CELDAS COMBINADAS
    ["B1", "B2", "B3"].forEach((cell) => {
      worksheet.getCell(cell).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(cell).font = { bold: true, size: 14 };
    });

    let jsonServicio: any = [];
    let incluirCajero = this.selectedItems.length != 0

    if (this.todasSucursalesES || this.seleccionMultiple) {
      for (let i = 0; i < this.servicioEntradaSalida.length; i++) {
        let fila = [
          this.servicioEntradaSalida[i].nombreEmpresa,
          this.addOneDay(new Date(this.servicioEntradaSalida[i].fecha)),
          this.servicioEntradaSalida[i].hora,
          this.servicioEntradaSalida[i].Razon,
        ]
        if (incluirCajero) {
          fila.splice(1, 0, this.servicioEntradaSalida[i].Usuario); // Insertar "CAJERO" en la segunda posición
        }
        jsonServicio.push(fila);
      }




      if (incluirCajero) {
        worksheet.columns = [
          { key: "sucursal", width: 50 },
          { key: "cajero", width: 20 },
          { key: "fecha", width: 50 },
          { key: "hora", width: 50 },
          { key: "razon", width: 20 },
        ]
      } else {
        worksheet.columns = [
          { key: "sucursal", width: 50 },
          { key: "fecha", width: 50 },
          { key: "hora", width: 50 },
          { key: "razon", width: 20 },
        ]
      }

      const columnas = [
        { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
        { name: "FECHA", totalsRowLabel: "", filterButton: true },
        { name: "HORA", totalsRowLabel: "", filterButton: true },
        { name: "RAZON", totalsRowLabel: "", filterButton: true },
      ]

      if (incluirCajero) {
        columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
      }

      worksheet.addTable({
        name: "UsuariosexcelTabla",
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
      let tamanioC = 0;

      for (let i = 0; i <= numeroFilas; i++) {
        incluirCajero ? tamanioC = 5 : tamanioC = 4

        for (let j = 1; j <= tamanioC; j++) {
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
    } else {
      for (let i = 0; i < this.servicioEntradaSalida.length; i++) {
        let fila = [
          this.addOneDay(new Date(this.servicioEntradaSalida[i].fecha)),
          this.servicioEntradaSalida[i].hora,
          this.servicioEntradaSalida[i].Razon,
        ]
        if (incluirCajero) {
          fila.splice(0, 0, this.servicioEntradaSalida[i].Usuario); // Insertar "CAJERO" en la segunda posición
        }
        jsonServicio.push(fila);
      }

      if (incluirCajero) {
        worksheet.columns = [
          { key: "cajero", width: 20 },
          { key: "fecha", width: 50 },
          { key: "hora", width: 50 },
          { key: "razon", width: 20 },
        ]

      } else {
        worksheet.columns = [
          { key: "fecha", width: 50 },
          { key: "hora", width: 50 },
          { key: "razon", width: 20 },
        ]

      }

      const columnas = [
        { name: "FECHA", totalsRowLabel: "", filterButton: true },
        { name: "HORA", totalsRowLabel: "", filterButton: true },
        { name: "RAZON", totalsRowLabel: "", filterButton: true },
      ]

      if (incluirCajero) {
        columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
      }

      worksheet.addTable({
        name: "UsuariosexcelTabla",
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
      let tamanioC = 0;

      for (let i = 0; i <= numeroFilas; i++) {
        incluirCajero ? tamanioC = 4 : tamanioC = 3

        for (let j = 1; j <= tamanioC; j++) {
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
    }

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, "Entradas y salidas - " +
        nombreSucursal +
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

  async ExportTOExcelTurnosTotalFecha() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Turnos totales");
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
    worksheet.getCell("B1").value = 'REPORTE - TURNOS TOTALES'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fromDateTurnosTotalFecha.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosTotalFecha.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "Periodo de " + fechaDesde + " hasta " + fechaHasta;
    // APLICAR ESTILO DE CENTRADO Y NEGRITA A LAS CELDAS COMBINADAS
    ["B1", "B2", "B3"].forEach((cell) => {
      worksheet.getCell(cell).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(cell).font = { bold: true, size: 14 };
    });

    let incluirCajero = this.selectedItems.length != 0
    console.log("ver incluirCajero ", incluirCajero)
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.serviciosSeleccionadas.length == 0) {
      if (this.todasSucursalesTTF || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].nombreEmpresa,
              this.addOneDay(new Date(this.servicioTurnosTotalFecha[i].Fecha)),
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }
          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }

          jsonServicio.push(pie)

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "sucursal", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }


          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }



        } else {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].nombreEmpresa,
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]

            if (incluirCajero) {
              fila.splice(1, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);

          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }

          jsonServicio.push(pie)

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }


          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        }

        worksheet.addTable({
          name: "turnostotales",
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
        let tamanioC = 0;
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 7 : tamanioC = 6
          } else {
            incluirCajero ? tamanioC = 6 : tamanioC = 5
          }
          for (let j = 1; j <= tamanioC; j++) {
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
      } else {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.addOneDay(new Date(this.servicioTurnosTotalFecha[i].Fecha)),
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);


          }

          let pie = []

          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }

          jsonServicio.push(pie)
          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }



          columnas = [
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //  worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }


        } else {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]

            if (incluirCajero) {
              fila.splice(0, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }

          jsonServicio.push(pie)

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }


          columnas = [
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        }

        worksheet.addTable({
          name: "turnostotales",
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
        let tamanioC = 0;
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 6 : tamanioC = 5
          } else {
            incluirCajero ? tamanioC = 5 : tamanioC = 4
          }
          for (let j = 1; j <= tamanioC; j++) {
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


      }


    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTTF || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {

            let fila = [
              this.servicioTurnosTotalFecha[i].nombreEmpresa,
              this.servicioTurnosTotalFecha[i].Servicio,
              this.addOneDay(new Date(this.servicioTurnosTotalFecha[i].Fecha)),
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }
          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          else {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]

          }

          jsonServicio.push(pie);

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]

          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]

          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }



        } else {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].nombreEmpresa,
              this.servicioTurnosTotalFecha[i].Servicio,
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          jsonServicio.push(pie)


          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }



          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        }

        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 8 : tamanioC = 7
          } else {
            incluirCajero ? tamanioC = 7 : tamanioC = 6
          }
          for (let j = 1; j <= tamanioC; j++) {
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

      } else {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].Servicio,
              this.addOneDay(new Date(this.servicioTurnosTotalFecha[i].Fecha)),
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]

            if (incluirCajero) {
              fila.splice(0, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          jsonServicio.push(pie)
          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }


        } else {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].Servicio,
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);

          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          jsonServicio.push(pie)


          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }
          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]
          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }


        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 7 : tamanioC = 6
          } else {
            incluirCajero ? tamanioC = 6 : tamanioC = 5
          }
          for (let j = 1; j <= tamanioC; j++) {
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

      }
    } else if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTTF || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].nombreEmpresa,
              this.servicioTurnosTotalFecha[i].Servicio,
              this.servicioTurnosTotalFecha[i].subservicio,
              this.addOneDay(new Date(this.servicioTurnosTotalFecha[i].Fecha)),
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]

            if (incluirCajero) {
              fila.splice(1, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          jsonServicio.push(pie)



          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //  worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }


        } else {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].nombreEmpresa,
              this.servicioTurnosTotalFecha[i].Servicio,
              this.servicioTurnosTotalFecha[i].subservicio,
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          jsonServicio.push(pie)

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        }

        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 9 : tamanioC = 8

          } else {
            incluirCajero ? tamanioC = 8 : tamanioC = 7
          }

          for (let j = 1; j <= tamanioC; j++) {
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


      } else {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].Servicio,
              this.servicioTurnosTotalFecha[i].subservicio,
              this.addOneDay(new Date(this.servicioTurnosTotalFecha[i].Fecha)),
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }

          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }
          jsonServicio.push(pie)


          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        } else {
          for (let i = 0; i < this.servicioTurnosTotalFecha.length; i++) {
            let fila = [
              this.servicioTurnosTotalFecha[i].Servicio,
              this.servicioTurnosTotalFecha[i].subservicio,
              this.servicioTurnosTotalFecha[i].Atendidos,
              this.servicioTurnosTotalFecha[i].No_Atendidos,
              this.servicioTurnosTotalFecha[i].Total,
              this.servicioTurnosTotalFecha[i].PORCENTAJE + '%'
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioTurnosTotalFecha[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }
          let pie = []
          if (incluirCajero) {
            pie = [
              '',
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          } else {
            pie = [
              '',
              '',
              '',
              'Total: ',
              this.suma,
              this.porcentajeTotal + '%'
            ]
          }

          jsonServicio.push(pie)



          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "atendidos", width: 20 },
              { key: "noatendidos", width: 20 },
              { key: "total", width: 20 },
              { key: "porcentaje", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL", totalsRowLabel: "", filterButton: true },
            { name: "PORCENTAJE OCUPACIÓN", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }


        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 8 : tamanioC = 7
          } else {
            incluirCajero ? tamanioC = 7 : tamanioC = 6
          }
          for (let j = 1; j <= tamanioC; j++) {
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

      }

    }

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, `Turnos totales.xlsx`);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }
  }

  async ExportTOExcelTurnosMeta() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Turnos meta");
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
    worksheet.mergeCells("B1:G1");
    worksheet.mergeCells("B2:G2");
    worksheet.mergeCells("B3:G3");
    worksheet.mergeCells("B4:G4");
    worksheet.mergeCells("B5:G5");

    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'REPORTE - PORCENTAJE DE CUMPLIMIENTO'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fromDateTurnosMeta.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosMeta.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "Periodo de " + fechaDesde + " hasta " + fechaHasta;
    // APLICAR ESTILO DE CENTRADO Y NEGRITA A LAS CELDAS COMBINADAS
    ["B1", "B2", "B3"].forEach((cell) => {
      worksheet.getCell(cell).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      worksheet.getCell(cell).font = { bold: true, size: 14 };
    });

    let incluirCajero = this.selectedItems.length != 0
    let jsonServicio: any = [];

    if (this.serviciosSeleccionadas.length == 0) {
      // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
      if (this.todasSucursalesTM || this.seleccionMultiple) {
        let columnas = []

        for (let i = 0; i < this.servicioTurnosMeta.length; i++) {
          let fila = [
            this.servicioTurnosMeta[i].nombreEmpresa,
            this.addOneDay(new Date(this.servicioTurnosMeta[i].Fecha)),
            this.servicioTurnosMeta[i].Atendidos,
            this.servicioTurnosMeta[i].Porcentaje_Atendidos + "%",
          ]
          if (incluirCajero) {
            fila.splice(1, 0, this.servicioTurnosMeta[i].Usuario); // Insertar "CAJERO" en la segunda posición
          }
          jsonServicio.push(fila);
        }

        if (incluirCajero) {
          worksheet.columns = [
            { key: "sucursal", width: 50 },
            { key: "cajero", width: 20 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        } else {
          worksheet.columns = [
            { key: "sucursal", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        }

        columnas = [
          { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: true },
          { name: "FECHA", totalsRowLabel: "", filterButton: true },
          { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
          { name: "PORCENTAJE DE CUMPLIMIENTO ", totalsRowLabel: "", filterButton: true },
        ]

        if (incluirCajero) {
          // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
          columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
        }



        worksheet.addTable({
          name: "turnosmeta",
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

        let tamanioC = 0;
        const numeroFilas = jsonServicio.length;
        for (let i = 0; i <= numeroFilas; i++) {
          incluirCajero ? tamanioC = 5 : tamanioC = 4
          for (let j = 1; j <= tamanioC; j++) {
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


      } else {
        let columnas = []
        for (let i = 0; i < this.servicioTurnosMeta.length; i++) {
          let fila = [
            this.addOneDay(new Date(this.servicioTurnosMeta[i].Fecha)),
            this.servicioTurnosMeta[i].Atendidos,
            this.servicioTurnosMeta[i].Porcentaje_Atendidos + "%",
          ]
          if (incluirCajero) {
            fila.splice(0, 0, this.servicioTurnosMeta[i].Usuario); // Insertar "CAJERO" en la primera posición
          }
          jsonServicio.push(fila);
        }

        if (incluirCajero) {
          worksheet.columns = [
            { key: "cajero", width: 20 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        } else {
          worksheet.columns = [
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        }

        columnas = [
          { name: "FECHA", totalsRowLabel: "", filterButton: true },
          { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
          { name: "PORCENTAJE DE CUMPLIMIENTO ", totalsRowLabel: "", filterButton: true },
        ]

        if (incluirCajero) {
          //worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
          columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
        }


        worksheet.addTable({
          name: "turnosmeta",
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
        let tamanioC = 0;

        for (let i = 0; i <= numeroFilas; i++) {
          incluirCajero ? tamanioC = 4 : tamanioC = 3
          for (let j = 1; j <= tamanioC; j++) {
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
      }
    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTM || this.seleccionMultiple) {
        let columnas = []

        for (let i = 0; i < this.servicioTurnosMeta.length; i++) {
          let fila = [
            this.servicioTurnosMeta[i].nombreEmpresa,
            this.servicioTurnosMeta[i].Servicio,
            this.addOneDay(new Date(this.servicioTurnosMeta[i].Fecha)),
            this.servicioTurnosMeta[i].Atendidos,
            this.servicioTurnosMeta[i].Porcentaje_Atendidos + "%",
          ]
          if (incluirCajero) {
            fila.splice(1, 0, this.servicioTurnosMeta[i].Usuario); // Insertar "CAJERO" en la segunda posición
          }
          jsonServicio.push(fila);
        }

        if (incluirCajero) {
          worksheet.columns = [
            { key: "sucursal", width: 50 },
            { key: "cajero", width: 20 },
            { key: "servicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        } else {
          worksheet.columns = [
            { key: "sucursal", width: 50 },
            { key: "servicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        }

        columnas = [
          { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: true },
          { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
          { name: "FECHA", totalsRowLabel: "", filterButton: true },
          { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
          { name: "PORCENTAJE DE CUMPLIMIENTO ", totalsRowLabel: "", filterButton: true },
        ]

        if (incluirCajero) {
          // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
          columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
        }



        worksheet.addTable({
          name: "turnosmeta",
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

        let tamanioC = 0;
        const numeroFilas = jsonServicio.length;
        for (let i = 0; i <= numeroFilas; i++) {
          incluirCajero ? tamanioC = 6 : tamanioC = 5
          for (let j = 1; j <= tamanioC; j++) {
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


      } else {
        let columnas = []
        for (let i = 0; i < this.servicioTurnosMeta.length; i++) {
          let fila = [
            this.servicioTurnosMeta[i].Servicio,
            this.addOneDay(new Date(this.servicioTurnosMeta[i].Fecha)),
            this.servicioTurnosMeta[i].Atendidos,
            this.servicioTurnosMeta[i].Porcentaje_Atendidos + "%",
          ]
          if (incluirCajero) {
            fila.splice(0, 0, this.servicioTurnosMeta[i].Usuario); // Insertar "CAJERO" en la primera posición
          }
          jsonServicio.push(fila);
        }

        if (incluirCajero) {
          worksheet.columns = [
            { key: "cajero", width: 20 },
            { key: "servicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        } else {
          worksheet.columns = [
            { key: "servicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        }

        columnas = [
          { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
          { name: "FECHA", totalsRowLabel: "", filterButton: true },
          { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
          { name: "PORCENTAJE DE CUMPLIMIENTO ", totalsRowLabel: "", filterButton: true },
        ]

        if (incluirCajero) {
          //worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
          columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
        }


        worksheet.addTable({
          name: "turnosmeta",
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
        let tamanioC = 0;

        for (let i = 0; i <= numeroFilas; i++) {
          incluirCajero ? tamanioC = 5 : tamanioC = 4
          for (let j = 1; j <= tamanioC; j++) {
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
      }
    } else if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
      if (this.todasSucursalesTM || this.seleccionMultiple) {
        let columnas = []

        for (let i = 0; i < this.servicioTurnosMeta.length; i++) {
          let fila = [
            this.servicioTurnosMeta[i].nombreEmpresa,
            this.servicioTurnosMeta[i].Servicio,
            this.servicioTurnosMeta[i].subservicio,
            this.addOneDay(new Date(this.servicioTurnosMeta[i].Fecha)),
            this.servicioTurnosMeta[i].Atendidos,
            this.servicioTurnosMeta[i].Porcentaje_Atendidos + "%",
          ]
          if (incluirCajero) {
            fila.splice(1, 0, this.servicioTurnosMeta[i].Usuario); // Insertar "CAJERO" en la segunda posición
          }
          jsonServicio.push(fila);
        }

        if (incluirCajero) {
          worksheet.columns = [
            { key: "sucursal", width: 50 },
            { key: "cajero", width: 20 },
            { key: "servicio", width: 50 },
            { key: "subservicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        } else {
          worksheet.columns = [
            { key: "sucursal", width: 50 },
            { key: "servicio", width: 50 },
            { key: "subservicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        }

        columnas = [
          { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: true },
          { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
          { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
          { name: "FECHA", totalsRowLabel: "", filterButton: true },
          { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
          { name: "PORCENTAJE DE CUMPLIMIENTO ", totalsRowLabel: "", filterButton: true },
        ]

        if (incluirCajero) {
          // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
          columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
        }



        worksheet.addTable({
          name: "turnosmeta",
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

        let tamanioC = 0;
        const numeroFilas = jsonServicio.length;
        for (let i = 0; i <= numeroFilas; i++) {
          incluirCajero ? tamanioC = 7 : tamanioC = 6
          for (let j = 1; j <= tamanioC; j++) {
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


      } else {
        let columnas = []
        for (let i = 0; i < this.servicioTurnosMeta.length; i++) {
          let fila = [
            this.servicioTurnosMeta[i].Servicio,
            this.servicioTurnosMeta[i].subservicio,
            this.addOneDay(new Date(this.servicioTurnosMeta[i].Fecha)),
            this.servicioTurnosMeta[i].Atendidos,
            this.servicioTurnosMeta[i].Porcentaje_Atendidos + "%",
          ]
          if (incluirCajero) {
            fila.splice(0, 0, this.servicioTurnosMeta[i].Usuario); // Insertar "CAJERO" en la primera posición
          }
          jsonServicio.push(fila);
        }

        if (incluirCajero) {
          worksheet.columns = [
            { key: "cajero", width: 20 },
            { key: "servicio", width: 50 },
            { key: "subservicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        } else {
          worksheet.columns = [
            { key: "servicio", width: 50 },
            { key: "subservicio", width: 50 },
            { key: "fecha", width: 20 },
            { key: "atendidos", width: 20 },
            { key: "porcentaje", width: 20 },
          ]
        }

        columnas = [
          { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
          { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
          { name: "FECHA", totalsRowLabel: "", filterButton: true },
          { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
          { name: "PORCENTAJE DE CUMPLIMIENTO ", totalsRowLabel: "", filterButton: true },
        ]

        if (incluirCajero) {
          //worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
          columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
        }


        worksheet.addTable({
          name: "turnosmeta",
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
        let tamanioC = 0;

        for (let i = 0; i <= numeroFilas; i++) {
          incluirCajero ? tamanioC = 6 : tamanioC = 5
          for (let j = 1; j <= tamanioC; j++) {
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
      }
    }

    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, "Turnos meta - " +
        nombreSucursal +
        " " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }

  }

  async exportarAExcelPromAtencion() {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tiempo de Atención");
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
    worksheet.getCell("B1").value = 'REPORTE - TIEMPO ATENCIÓN'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fromDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "Periodo de " + fechaDesde + " hasta " + fechaHasta;
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
    let incluirCajero = this.selectedItems.length != 0

    if (this.serviciosSeleccionadas.length == 0) {
      if (this.todasSucursalesTPA || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {
            let fila = [
              this.servicioPromAtencion[i].nombreEmpresa,
              this.addOneDay(new Date(this.servicioPromAtencion[i].Fecha)),
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }


          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]


          if (incluirCajero) {
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        } else {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {
            let fila = [
              this.servicioPromAtencion[i].nombreEmpresa,
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]


          if (incluirCajero) {
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }

        worksheet.addTable({
          name: "promedioatencion",
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
        let tamanioC = 0;

        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 6 : tamanioC = 5

          } else {
            incluirCajero ? tamanioC = 5 : tamanioC = 4
          }
          for (let j = 1; j <= tamanioC; j++) {
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
      } else {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {
            let fila = [
              this.addOneDay(new Date(this.servicioPromAtencion[i].Fecha)),
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila)
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }

          columnas = [
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        } else {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {

            let fila = [
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila)
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }


          columnas = [
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }




        worksheet.addTable({
          name: "turnostotales",
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
        let tamanioC = 0;
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 5 : tamanioC = 4
          } else {
            incluirCajero ? tamanioC = 4 : tamanioC = 3
          }
          for (let j = 1; j <= tamanioC; j++) {
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


      }


    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTPA || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {
            let fila = [
              this.servicioPromAtencion[i].nombreEmpresa,
              this.servicioPromAtencion[i].Servicio,
              this.addOneDay(new Date(this.servicioPromAtencion[i].Fecha)),
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,

              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila)
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },

              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },

              { key: "turnos", width: 20 },
            ]
          }



          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        } else {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {

            let fila = [
              this.servicioPromAtencion[i].nombreEmpresa,
              this.servicioPromAtencion[i].Servicio,
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,

              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }


          if (incluirCajero) {

            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]

          } else {

            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]

          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }



        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0

        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 7 : tamanioC = 6
          } else {
            incluirCajero ? tamanioC = 6 : tamanioC = 5
          }
          for (let j = 1; j <= tamanioC; j++) {
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

      } else {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {


            let fila = [
              this.servicioPromAtencion[i].Servicio,
              this.addOneDay(new Date(this.servicioPromAtencion[i].Fecha)),
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);

          }


          if (incluirCajero) {

            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },

              { key: "turnos", width: 20 },
            ]

          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },

              { key: "turnos", width: 20 },
            ]

          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]
          if (incluirCajero) {
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        } else {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {
            let fila = [
              this.servicioPromAtencion[i].Servicio,
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,

              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);

          }


          if (incluirCajero) {

            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },

              { key: "turnos", width: 20 },
            ]

          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },

              { key: "turnos", width: 20 },
            ]

          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]
          if (incluirCajero) {
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }


        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0

        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 6 : tamanioC = 5
          } else {
            incluirCajero ? tamanioC = 5 : tamanioC = 4
          }
          for (let j = 1; j <= tamanioC; j++) {
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

      }
    } else if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTPA || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {

            let fila = [
              this.servicioPromAtencion[i].nombreEmpresa,
              this.servicioPromAtencion[i].Servicio,
              this.servicioPromAtencion[i].subservicio,
              this.addOneDay(new Date(this.servicioPromAtencion[i].Fecha)),
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }

            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }
          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        } else {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {


            let fila = [
              this.servicioPromAtencion[i].nombreEmpresa,
              this.servicioPromAtencion[i].Servicio,
              this.servicioPromAtencion[i].subservicio,
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }


          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },

            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]

          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        }


        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0

        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 8 : tamanioC = 7

          } else {
            incluirCajero ? tamanioC = 7 : tamanioC = 6
          }
          for (let j = 1; j <= tamanioC; j++) {
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


      } else {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {
            let fila = [
              this.servicioPromAtencion[i].Servicio,
              this.servicioPromAtencion[i].subservicio,
              this.addOneDay(new Date(this.servicioPromAtencion[i].Fecha)),
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);

          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "fecha", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }
        } else {
          for (let i = 0; i < this.servicioPromAtencion.length; i++) {

            let fila = [
              this.servicioPromAtencion[i].Servicio,
              this.servicioPromAtencion[i].subservicio,
              this.servicioPromAtencion[i].Promedio,
              this.servicioPromAtencion[i].Maximo,
              this.servicioPromAtencion[i].Turnos,
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioPromAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 20 },
              { key: "promedio", width: 20 },
              { key: "maximo", width: 20 },
              { key: "turnos", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO PROMEDIO", totalsRowLabel: "", filterButton: true },
            { name: "TIEMPO MÁXIMO", totalsRowLabel: "", filterButton: true },
            { name: "TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        }




        worksheet.addTable({
          name: "UsuariosexcelTabla",
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
        let tamanioC = 0
        for (let i = 0; i <= numeroFilas; i++) {
          if (this.verFecha == '1') {
            incluirCajero ? tamanioC = 7 : tamanioC = 6

          } else {
            incluirCajero ? tamanioC = 6 : tamanioC = 5
          }
          for (let j = 1; j <= tamanioC; j++) {
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

      }

    }
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, "Promedio de atencion - " +
        nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }

  }

  async exportarAExcelTiempoAtencion() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tiempo de Atencion por Turnos");
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
    worksheet.mergeCells("B1:G1");
    worksheet.mergeCells("B2:G2");
    worksheet.mergeCells("B3:G3");
    worksheet.mergeCells("B4:G4");
    worksheet.mergeCells("B5:G5");

    // AGREGAR LOS VALORES A LAS CELDAS COMBINADAS
    worksheet.getCell("B1").value = 'REPORTE - TIEMPO DE ATENCIÓN POR TURNOS'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fromDateTiempoAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTiempoAtencion.nativeElement.value
      .toString()
      .trim();
    worksheet.getCell("B3").value = "Periodo de " + fechaDesde + " hasta " + fechaHasta;
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
    let incluirCajero = this.selectedItems.length != 0

    if (this.todasSucursalesTA || this.seleccionMultiple) {
      for (let i = 0; i < this.servicioTiempoAtencion.length; i++) {
        let fila = [
          this.servicioTiempoAtencion[i].nombreEmpresa,
          this.addOneDay(new Date(this.servicioTiempoAtencion[i].turn_fecha)),
          this.servicioTiempoAtencion[i].hora,
          this.servicioTiempoAtencion[i].Servicio,
          this.servicioTiempoAtencion[i].subservicio,
          this.servicioTiempoAtencion[i].cliente,
          this.servicioTiempoAtencion[i].turno,
          this.servicioTiempoAtencion[i].espera,
          this.servicioTiempoAtencion[i].atencion,
        ]
        if (incluirCajero) {
          fila.splice(1, 0, this.servicioTiempoAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
        }
        jsonServicio.push(fila);
      }

      if (incluirCajero) {
        worksheet.columns = [
          { key: "sucursal", width: 50 },
          { key: "cajero", width: 20 },
          { key: "fecha", width: 20 },
          { key: "hora", width: 20 },
          { key: "servicio", width: 50 },
          { key: "subservicio", width: 50 },
          { key: "cliente", width: 50 },
          { key: "turno", width: 20 },
          { key: "TiempoEspera", width: 20 },
          { key: "TiempoAtencion", width: 20 },
        ]
      } else {
        worksheet.columns = [
          { key: "sucursal", width: 50 },
          { key: "fecha", width: 20 },
          { key: "hora", width: 20 },
          { key: "servicio", width: 50 },
          { key: "subservicio", width: 50 },
          { key: "cliente", width: 50 },
          { key: "turno", width: 20 },
          { key: "TiempoEspera", width: 20 },
          { key: "TiempoAtencion", width: 20 },
        ]
      }

      const columnas = [
        { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: true },
        { name: "FECHA", totalsRowLabel: "", filterButton: true },
        { name: "HORA", totalsRowLabel: "", filterButton: true },
        { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
        { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
        { name: "CLIENTE", totalsRowLabel: "", filterButton: true },
        { name: "TURNO", totalsRowLabel: "", filterButton: true },
        { name: "TIEMPO DE ESPERA", totalsRowLabel: "", filterButton: true },
        { name: "TIEMPO DE ATENCIÓN", totalsRowLabel: "", filterButton: true },
      ]

      if (incluirCajero) {
        columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
      }

      worksheet.addTable({
        name: "tiempodeAtencion",
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
      let tamanioC = 0;

      for (let i = 0; i <= numeroFilas; i++) {
        incluirCajero ? tamanioC = 10 : tamanioC = 9

        for (let j = 1; j <= tamanioC; j++) {
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
    } else {
      for (let i = 0; i < this.servicioTiempoAtencion.length; i++) {

        let fila = [
          this.addOneDay(new Date(this.servicioTiempoAtencion[i].turn_fecha)),
          this.servicioTiempoAtencion[i].hora,
          this.servicioTiempoAtencion[i].Servicio,
          this.servicioTiempoAtencion[i].subservicio,
          this.servicioTiempoAtencion[i].cliente,
          this.servicioTiempoAtencion[i].turno,
          this.servicioTiempoAtencion[i].espera,
          this.servicioTiempoAtencion[i].atencion,
        ]
        if (incluirCajero) {
          fila.splice(0, 0, this.servicioTiempoAtencion[i].Nombre); // Insertar "CAJERO" en la segunda posición
        }
        jsonServicio.push(fila);
      }
      if (incluirCajero) {
        worksheet.columns = [
          { key: "cajero", width: 20 },
          { key: "fecha", width: 20 },
          { key: "hora", width: 20 },
          { key: "servicio", width: 50 },
          { key: "subservicio", width: 50 },
          { key: "cliente", width: 50 },
          { key: "turno", width: 20 },
          { key: "TiempoEspera", width: 20 },
          { key: "TiempoAtencion", width: 20 },
        ]
      } else {
        worksheet.columns = [
          { key: "fecha", width: 20 },
          { key: "hora", width: 20 },
          { key: "servicio", width: 50 },
          { key: "subservicio", width: 50 },
          { key: "cliente", width: 50 },
          { key: "turno", width: 20 },
          { key: "TiempoEspera", width: 20 },
          { key: "TiempoAtencion", width: 20 },
        ]
      }
      const columnas = [
        { name: "FECHA", totalsRowLabel: "", filterButton: true },
        { name: "HORA", totalsRowLabel: "", filterButton: true },
        { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
        { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
        { name: "CLIENTE", totalsRowLabel: "", filterButton: true },
        { name: "TURNO", totalsRowLabel: "", filterButton: true },
        { name: "TIEMPO DE ESPERA", totalsRowLabel: "", filterButton: true },
        { name: "TIEMPO DE ATENCIÓN", totalsRowLabel: "", filterButton: true },
      ]
      if (incluirCajero) {
        columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
      }
      worksheet.addTable({
        name: "tiempoatencion",
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
      let tamanioC = 0;
      for (let i = 0; i <= numeroFilas; i++) {
        incluirCajero ? tamanioC = 9 : tamanioC = 8
        for (let j = 1; j <= tamanioC; j++) {
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
    }
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      FileSaver.saveAs(blob, "Tiempo de atencion - " +
        nombreSucursal +
        " - " +
        new Date().toLocaleString() +
        EXCEL_EXTENSION);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }
  }



  validarHoras(hInicio: any, hFin: any) {
    let diaCompleto: boolean = false;

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    }

    if (diaCompleto) {
      return {};
    } else {
      return {
        style: "subtitulos",
        text: "Hora desde " + hInicio + " hasta " + hFin,
      };
    }
  }

  // GENERACION DE PDF'S
  generarPdfTurnosFecha(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateTurnosFecha.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosFecha.nativeElement.value
      .toString()
      .trim();

    let horaInicio = this.horaInicioTF.nativeElement.value;
    let horaFin = this.horaFinTF.nativeElement.value;

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentturnosfecha(
        fechaDesde,
        fechaHasta,
        horaInicio,
        horaFin,
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
  getDocumentturnosfecha(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any) {
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
        this.CampoDetalle(this.servicioTurnosFecha), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  CampoDetalle(servicio: any[]) {
    if (this.todasSucursalesTF) {
      return {
        style: "tableMargin",
        table: {
          headerRows: 1,
          widths: ["*", "*", "auto", "auto", "auto", "auto", "auto", "auto"],

          body: [
            [
              { text: "Sucursal", style: "tableHeader" },
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Subservicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.nombreEmpresa },
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.subservicio },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Atendidos },
                { style: "itemsTable", text: res.No_Atendidos },
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
          widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],

          body: [
            [
              { text: "Cajero(a)", style: "tableHeader" },
              { text: "Servicio", style: "tableHeader" },
              { text: "Subservicio", style: "tableHeader" },
              { text: "Fecha", style: "tableHeader" },
              { text: "Atendidos", style: "tableHeader" },
              { text: "No atendidos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...servicio.map((res) => {
              return [
                { style: "itemsTable", text: res.Usuario },
                { style: "itemsTable", text: res.Servicio },
                { style: "itemsTable", text: res.subservicio },
                { style: "itemsTable", text: res.Fecha },
                { style: "itemsTable", text: res.Atendidos },
                { style: "itemsTable", text: res.No_Atendidos },
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

  generarPdfTurnosTotalFecha(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateTurnosTotalFecha.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosTotalFecha.nativeElement.value
      .toString()
      .trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentturnosTotalfecha(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentturnosTotalfecha(fechaDesde: any, fechaHasta: any) {
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
        this.CampoDetalleTotal(this.servicioTurnosTotalFecha), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
        this.grafico(), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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
  // CAMBIO ORIENTACION
  cambiarOrientacion(orientacion: string) {
    this.orientacion = orientacion;
  }

  grafico() {


    if (this.mostrar_resultado && this.verFecha != '1' && this.selectedItems.length == 0 && this.serviciosSeleccionadas.length > 0 && this.sub_serviciosSeleccionadas.length == 0) {
      var canvas1 = document.querySelector("#canvas") as HTMLCanvasElement;
      // DE IMAGEN HTML, A MAPA64 BITS FORMATO CON EL QUE TRABAJA PDFMAKE
      var canvasImg = canvas1.toDataURL("image/png");
      if (this.orientacion == "landscape") {
        return {
          image: canvasImg,
          fit: [800, 500],
          margin: [0, 50, 0, 10],
          alignment: "center",
          pageBreak: 'before'
        };
      } else {
        return {
          image: canvasImg,
          fit: [500, 350],
          margin: [0, 50, 0, 10],
          alignment: "center",
        };
      }
    }
  }
  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  CampoDetalleTotal(servicio: any[]) {
    let incluirCajero = this.selectedItems.length != 0

    if (this.serviciosSeleccionadas.length == 0) {

      if (this.todasSucursalesTTF) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {

              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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
                widths: ["*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
                ],
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return rowIndex % 2 === 0 ? "#E5E7E9" : null;
                },
              },


            };
          }

        } else {
          if (incluirCajero) {
            return {

              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
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
                widths: ["*", "*", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
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

      } else {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "auto", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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
                widths: ["*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
                ],
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return rowIndex % 2 === 0 ? "#E5E7E9" : null;
                },
              },
            };
          }


        } else {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
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
                widths: ["*", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
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
    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {

      if (this.todasSucursalesTTF) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "*", "*", "auto", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

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
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
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
                widths: ["*", "*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
                ],
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return rowIndex % 2 === 0 ? "#E5E7E9" : null;
                },
              },
            };
          }

        } else {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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
                widths: ["*", "*", "*", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },
                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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

      } else {

        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]

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
                widths: ["*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]

                ],
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return rowIndex % 2 === 0 ? "#E5E7E9" : null;
                },
              },
            };
          }


        } else {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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
                widths: ["*", "*", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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

    } if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTTF) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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
                widths: ["*", "*", "*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
                ],
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return rowIndex % 2 === 0 ? "#E5E7E9" : null;
                },
              },
            };
          }

        } else {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["*", "auto", "*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },

                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]
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
                widths: ["*", "*", "*", "*", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },

                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },
                  ]
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

      } else {
        if (this.verFecha == '1') {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]

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
                widths: ["*", "*", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },

                    { text: "Fecha", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]

                ],
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return rowIndex % 2 === 0 ? "#E5E7E9" : null;
                },
              },
            };
          }


        } else {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                widths: ["auto", "auto", "*", "auto", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Usuario },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]

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
                widths: ["*", "*", "*", "auto", "auto", "auto"],

                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Atendidos", style: "tableHeader" },
                    { text: "No atendidos", style: "tableHeader" },
                    { text: "Total", style: "tableHeader" },
                    { text: "Porcentaje Ocupación", style: "tableHeader" },

                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Atendidos },
                      { style: "itemsTable", text: res.No_Atendidos },
                      { style: "itemsTable", text: res.Total },
                      { style: "itemsTable", text: res.PORCENTAJE + '%' },

                    ];
                  }),
                  [
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: '' },
                    { style: "itemsTable", text: 'Total:' },
                    { style: "itemsTable", text: this.suma },
                    { style: "itemsTable", text: this.porcentajeTotal + '%' },

                  ]

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
    }
  }

  generarPdfTurnosMeta(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateTurnosMeta.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTurnosMeta.nativeElement.value
      .toString()
      .trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentturnosMeta(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentturnosMeta(fechaDesde: any, fechaHasta: any) {
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
              text: "Reporte - Porcentaje de cumplimiento ",
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
        this.CampoDetalleMeta(this.servicioTurnosMeta), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // FUNCION PARA LLENAR LA TABLA CON LA CONSULTA REALIZADA AL BACKEND
  CampoDetalleMeta(servicio: any[]) {
    let incluirCajero = this.selectedItems.length != 0
    if (this.serviciosSeleccionadas.length == 0) {
      if (this.todasSucursalesTM) {
        if (incluirCajero) {
          return {
            style: "tableMargin",
            table: {
              headerRows: 1,
              widths: ["*", "*", "*", "*",  "auto", ],
  
              body: [
                [
                  { text: "Sucursal", style: "tableHeader" },
                  { text: "Cajero(a)", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.nombreEmpresa },
                    { style: "itemsTable", text: res.Usuario },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
              widths: ["*", "*", "*", "auto"],
  
              body: [
                [
                  { text: "Sucursal", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.nombreEmpresa },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
  
      } else {
  
        if (incluirCajero) {
          return {
            style: "tableMargin",
            table: {
              headerRows: 1,
              widths: ["*", "*", "*", "auto"],
  
              body: [
                [
                  { text: "Cajero(a)", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.Usuario },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
              widths: ["*", "*", "auto"],
  
              body: [
                [
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
    }else if(this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0){
      if (this.todasSucursalesTM) {

        if (incluirCajero) {
          return {
            style: "tableMargin",
            table: {
              headerRows: 1,
              widths: ["*", "*", "*", "*", "auto", "auto", ],
  
              body: [
                [
                  { text: "Sucursal", style: "tableHeader" },
                  { text: "Cajero(a)", style: "tableHeader" },
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.nombreEmpresa },
                    { style: "itemsTable", text: res.Usuario },
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
              widths: ["*", "*", "*", "auto", "auto"],
  
              body: [
                [
                  { text: "Sucursal", style: "tableHeader" },
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.nombreEmpresa },
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
  
      } else {
  
        if (incluirCajero) {
          return {
            style: "tableMargin",
            table: {
              headerRows: 1,
              widths: ["*", "*", "*", "auto", "auto"],
  
              body: [
                [
                  { text: "Cajero(a)", style: "tableHeader" },
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.Usuario },
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
              widths: ["*", "*", "auto","auto"],
  
              body: [
                [
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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

    }else if(this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0){
      if (this.todasSucursalesTM) {

        if (incluirCajero) {
          return {
            style: "tableMargin",
            table: {
              headerRows: 1,
              widths: ["*", "*", "*", "*", "auto", "auto", "auto"],
  
              body: [
                [
                  { text: "Sucursal", style: "tableHeader" },
                  { text: "Cajero(a)", style: "tableHeader" },
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Subservicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.nombreEmpresa },
                    { style: "itemsTable", text: res.Usuario },
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.subservicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
              widths: ["*", "*", "*", "auto", "auto", "auto"],
  
              body: [
                [
                  { text: "Sucursal", style: "tableHeader" },
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Subservicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.nombreEmpresa },
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.subservicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
  
      } else {
  
        if (incluirCajero) {
          return {
            style: "tableMargin",
            table: {
              headerRows: 1,
              widths: ["*", "*", "*", "auto", "auto", "auto"],
  
              body: [
                [
                  { text: "Cajero(a)", style: "tableHeader" },
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Subservicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.Usuario },
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.subservicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
              widths: ["*", "*", "auto", "auto", "auto"],
  
              body: [
                [
                  { text: "Servicio", style: "tableHeader" },
                  { text: "Subservicio", style: "tableHeader" },
                  { text: "Fecha", style: "tableHeader" },
                  { text: "Atendidos", style: "tableHeader" },
                  { text: "Porcentaje de cumplimiento", style: "tableHeader" },
                ],
                ...servicio.map((res) => {
                  return [
                    { style: "itemsTable", text: res.Servicio },
                    { style: "itemsTable", text: res.subservicio },
                    { style: "itemsTable", text: res.Fecha },
                    { style: "itemsTable", text: res.Atendidos },
                    { style: "itemsTable", text: res.Porcentaje_Atendidos + " %" },
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
  }

  generarPdfPromAtencion(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDatePromAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDatePromAtencion.nativeElement.value
      .toString()
      .trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentpromatencion(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentpromatencion(fechaDesde: any, fechaHasta: any) {
    // OBTIENE FECHA ACTUAL
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
        this.Campopromedioatencion(this.servicioPromAtencion), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
  Campopromedioatencion(servicio: any[]) {
    let incluirCajero = this.selectedItems.length != 0

    if (this.serviciosSeleccionadas.length == 0) {
      if (this.todasSucursalesTPA || this.seleccionMultiple) {

        if (this.verFecha == '1') {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },

                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },

                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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



        } else {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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

      } else {
        if (this.verFecha == '1') {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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


        } else {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto"],
                body: [
                  [
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTPA || this.seleccionMultiple) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },

                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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


        } else {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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

      } else {
        if (this.verFecha == '1') {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
        } else {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
    } if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesTPA || this.seleccionMultiple) {
        if (this.verFecha == '1') {

          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },

                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },

                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },

                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },

                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
        } else {
          if (incluirCajero) {

            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "*", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Sucursal", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.nombreEmpresa },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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


      } else {
        if (this.verFecha == '1') {

          if (incluirCajero) {

            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },

                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Fecha", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Fecha },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo }, ,
                      { style: "itemsTable", text: res.Turnos },
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


        } else {
          if (incluirCajero) {
            return {
              style: "tableMargin",
              table: {
                headerRows: 1,
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Cajero(a)", style: "tableHeader" },
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Nombre },
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
                alignment: "center",
                widths: ["*", "auto", "auto", "auto", "auto"],
                body: [
                  [
                    { text: "Servicio", style: "tableHeader" },
                    { text: "Subservicio", style: "tableHeader" },
                    { text: "Tiempo Promedio", style: "tableHeader" },
                    { text: "Tiempo Máximo", style: "tableHeader" },
                    { text: "Turnos", style: "tableHeader" },
                  ],
                  ...servicio.map((res) => {
                    return [
                      { style: "itemsTable", text: res.Servicio },
                      { style: "itemsTable", text: res.subservicio },
                      { style: "itemsTable", text: res.Promedio },
                      { style: "itemsTable", text: res.Maximo },
                      { style: "itemsTable", text: res.Turnos },
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
    }

  }

  generarPdfTiempoAtencion(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateTiempoAtencion.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateTiempoAtencion.nativeElement.value
      .toString()
      .trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentTiempoatencion(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentTiempoatencion(fechaDesde: any, fechaHasta: any) {
    // OBTIENE FECHA ACTUAL
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
              text: "Reporte - Tiempo de atención",
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
        this.Campotiempoatencion(this.servicioTiempoAtencion), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
  Campotiempoatencion(servicio: any[]) {
    let incluirCajero = this.selectedItems.length != 0

    if (this.todasSucursalesTA || this.seleccionMultiple) {

      if (incluirCajero) {
        return {
          style: "tableMargin",
          table: {
            headerRows: 1,
            alignment: "center",
            widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
            body: [
              [
                { text: "Sucursal", style: "tableHeader" },
                { text: "Cajero(a)", style: "tableHeader" },
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Servicio", style: "tableHeader" },
                { text: "Subservicio", style: "tableHeader" },
                { text: "Cliente", style: "tableHeader" },
                { text: "Turno", style: "tableHeader" },
                { text: "Tiempo de espera", style: "tableHeader" },
                { text: "Tiempo de atención", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.nombreEmpresa },
                  { style: "itemsTable", text: res.Nombre },
                  { style: "itemsTable", text: res.turn_fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Servicio },
                  { style: "itemsTable", text: res.subservicio },
                  { style: "itemsTable", text: res.cliente },
                  { style: "itemsTable", text: res.turno },
                  { style: "itemsTable", text: res.espera },
                  { style: "itemsTable", text: res.atencion },
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
            alignment: "center",
            widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
            body: [
              [
                { text: "Sucursal", style: "tableHeader" },
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Servicio", style: "tableHeader" },
                { text: "Subservicio", style: "tableHeader" },
                { text: "Cliente", style: "tableHeader" },
                { text: "Turno", style: "tableHeader" },
                { text: "Tiempo de espera", style: "tableHeader" },
                { text: "Tiempo de atención", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.nombreEmpresa },
                  { style: "itemsTable", text: res.turn_fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Servicio },
                  { style: "itemsTable", text: res.subservicio },
                  { style: "itemsTable", text: res.cliente },
                  { style: "itemsTable", text: res.turno },
                  { style: "itemsTable", text: res.espera },
                  { style: "itemsTable", text: res.atencion },
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

    } else {

      if (incluirCajero) {
        return {
          style: "tableMargin",
          table: {
            headerRows: 1,
            alignment: "center",
            widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
            body: [
              [
                { text: "Cajero(a)", style: "tableHeader" },
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Servicio", style: "tableHeader" },
                { text: "Subservicio", style: "tableHeader" },
                { text: "Cliente", style: "tableHeader" },
                { text: "Turno", style: "tableHeader" },
                { text: "Tiempo de espera", style: "tableHeader" },
                { text: "Tiempo de atención", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.Nombre },
                  { style: "itemsTable", text: res.turn_fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Servicio },
                  { style: "itemsTable", text: res.subservicio },
                  { style: "itemsTable", text: res.cliente },
                  { style: "itemsTable", text: res.turno },
                  { style: "itemsTable", text: res.espera },
                  { style: "itemsTable", text: res.atencion },
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
            alignment: "center",
            widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
            body: [
              [
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Servicio", style: "tableHeader" },
                { text: "Subservicio", style: "tableHeader" },
                { text: "Cliente", style: "tableHeader" },
                { text: "Turno", style: "tableHeader" },
                { text: "Tiempo de espera", style: "tableHeader" },
                { text: "Tiempo de atención", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.turn_fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Servicio },
                  { style: "itemsTable", text: res.subservicio },
                  { style: "itemsTable", text: res.cliente },
                  { style: "itemsTable", text: res.turno },
                  { style: "itemsTable", text: res.espera },
                  { style: "itemsTable", text: res.atencion },
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

  generarPdfEntradaSalida(action = "open", pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fechaDesde = this.fromDateUES.nativeElement.value.toString().trim();
    var fechaHasta = this.toDateUES.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentEntradasSalidas(
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

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentEntradasSalidas(fechaDesde, fechaHasta) {
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
        this.entradassalidassistema(this.servicioEntradaSalida), // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
  entradassalidassistema(servicio: any[]) {
    let incluirCajero = this.selectedItems.length != 0

    if (this.todasSucursalesES || this.seleccionMultiple) {

      if (incluirCajero) {
        return {
          style: "tableMargin",
          table: {
            headerRows: 1,
            alignment: "center",
            widths: ["*", "*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Sucursal", style: "tableHeader" },
                { text: "Cajero(a)", style: "tableHeader" },
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Razón", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.nombreEmpresa },
                  { style: "itemsTable", text: res.Usuario },
                  { style: "itemsTable", text: res.fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Razon },
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
            alignment: "center",
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Sucursal", style: "tableHeader" },
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Razón", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.nombreEmpresa },
                  { style: "itemsTable", text: res.fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Razon },
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


    } else {

      if (incluirCajero) {
        return {
          style: "tableMargin",
          table: {
            headerRows: 1,
            alignment: "center",
            widths: ["*", "auto", "auto", "auto"],
            body: [
              [
                { text: "Cajero(a)", style: "tableHeader" },
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Razón", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.Usuario },
                  { style: "itemsTable", text: res.fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Razon },
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
            alignment: "center",
            widths: ["*", "auto", "auto"],
            body: [
              [
                { text: "Fecha", style: "tableHeader" },
                { text: "Hora", style: "tableHeader" },
                { text: "Razón", style: "tableHeader" },
              ],
              ...servicio.map((res) => {
                return [
                  { style: "itemsTable", text: res.fecha },
                  { style: "itemsTable", text: res.hora },
                  { style: "itemsTable", text: res.Razon },
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


}
