import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { DatePipe } from '@angular/common'
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import { ServiceService } from '../../services/service.service';
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from '../../services/authentication.service';
import ExcelJS, { FillPattern } from "exceljs";
import * as FileSaver from 'file-saver';

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Utils } from '../../utils/util';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
import * as XLSX from 'xlsx';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-distestadoturnos',
  templateUrl: './distestadoturnos.component.html',
  styleUrls: ['./distestadoturnos.component.scss']
})

export class DistestadoturnosComponent implements OnInit {
  private imagen: any;


  private bordeCompleto!: Partial<ExcelJS.Borders>;
  private bordeGrueso!: Partial<ExcelJS.Borders>;
  private fillAzul!: FillPattern;
  private fontTitulo!: Partial<ExcelJS.Font>;
  private fontHipervinculo!: Partial<ExcelJS.Font>;






  private subscription!: Subscription;

  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild('fromDateDist') fromDateDist: ElementRef;
  @ViewChild('toDateDist') toDateDist: ElementRef;
  @ViewChild('fromDateDistRes') fromDateDistRes: ElementRef;
  @ViewChild('toDateDistRes') toDateDistRes: ElementRef;
  @ViewChild('codCajeroDist') codCajeroDist: ElementRef;
  @ViewChild('codCajeroDistRes') codCajeroDistRes: ElementRef;
  @ViewChild('codSucursalDist') codSucursalDist: ElementRef;
  @ViewChild('codSucursalDistRes') codSucursalDistRes: ElementRef;

  @ViewChild("horaInicioD") horaInicioD: ElementRef;
  @ViewChild("horaFinD") horaFinD: ElementRef;
  @ViewChild("horaInicioR") horaInicioR: ElementRef;
  @ViewChild("horaFinR") horaFinR: ElementRef;

  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioDist: any = [];
  servicioRes: any = [];
  sucursales: any[];
  serviciosServs: any = [];
  subservicios: any[];

  mostrar_resultado = false;

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



  verFecha: string = '1';
  CambiarFecha(opcion: string) {
    this.verFecha = opcion;
    this.mostrar_resultado = false
  }

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  mostrarServicios: boolean = false;
  mostrarSubservicios: boolean = false;

  cajerosUsuarios: any = [];
  todasSucursalesD: boolean = false;
  todasSucursalesR: boolean = false;
  todasServiciosTF: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestDist: boolean = false;
  malRequestDistPag: boolean = false;
  malRequestDistRes: boolean = false;
  malRequestDistPagRes: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configDE: any;
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: 'Anterior',
    nextLabel: 'Siguiente'
  };

  // OBTIENE FECHA ACTUAL PARA COLOCARLO EN CUADRO DE FECHA
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year + "-" + this.month + "-" + this.day;

  // IMAGEN LOGO
  urlImagen: string;

  // OPCIONES MULTIPLES
  allSelected = false;
  selectedItems: string[] = [];
  sucursalesSeleccionadas: string[] = [];
  serviciosSeleccionadas: string[] = [];
  sub_serviciosSeleccionadas: string[] = [];

  seleccionMultiple: boolean = false;
  seleccionMultipleServicios: boolean = false;
  seleccionMultipleSubServicios: boolean = false;

  // MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  // INFORMACION
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  constructor(
    private auth: AuthenticationService,
    private router: Router, public datePipe: DatePipe,
    private toastr: ToastrService,
    private serviceService: ServiceService,
    private imagenesService: ImagenesService
  ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configDE = {
      id: 'disestde',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioDist.length
    };


    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedDE(event: any) {
    this.configDE.currentPage = event;
  }


  ngOnInit(): void {
    // CARGAMOS COMPONENTES SELECTS HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem('loggedUser');
    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestDistPag = true;
    this.malRequestDistPagRes = true;
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
    switch (opcion) {
      case 'allSelected':
        this.allSelected = !this.allSelected;
        break;
      case 'todasSucursalesD':
        this.todasSucursalesD = !this.todasSucursalesD;
        this.todasSucursalesD ? (this.getCajeros(this.sucursalesSeleccionadas), this.getServicios(this.sucursalesSeleccionadas)) : null;
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

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // SE OBTIENE LA FECHA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, 'yyyy-MM-dd');
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
    this.todasSucursalesD = false;
    this.todasSucursalesR = false;
    this.todasServiciosTF = false;

    this.seleccionMultiple = false;
    this.seleccionMultipleServicios = false;
    this.seleccionMultipleSubServicios = false;

    this.sucursalesSeleccionadas = [];
    this.serviciosSeleccionadas = [];
    this.sub_serviciosSeleccionadas = []
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string) {
    return cod == "-1" ? true : false;
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  leerDistribucionTurnos() {
    // Cancelar cualquier intervalo previo antes de iniciar uno nuevo
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Ejecutar la primera vez
    this.ejecutarBusqueda();

    // Configurar la repetición cada 30 segundos
    this.subscription = interval(5000).subscribe(() => {
      this.ejecutarBusqueda();
    });
  }


  ejecutarBusqueda() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateDist.nativeElement.value.toString().trim();
    var fH = this.toDateDist.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioD.nativeElement.value;
    let horaFin = this.horaFinD.nativeElement.value;

    console.log("se esta iniciando la busqueda")

    var datoCajero: any = '0N';
    if (this.selectedItems.length != 0) {
      datoCajero = this.selectedItems;
    }

    if (this.sucursalesSeleccionadas.length !== 0) {
      this.serviceService.getdistribucionturnos(fD, fH, horaInicio, horaFin, datoCajero, this.sucursalesSeleccionadas, this.serviciosSeleccionadas, this.sub_serviciosSeleccionadas, this.estadoUsuario, this.verFecha).subscribe((servicio: any) => {
        // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
        this.servicioDist = servicio.turnos;
        console.log("ver numero de registros: ", this.servicioDist.length)
        this.malRequestDist = false;
        this.malRequestDistPag = false;
        // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
        if (this.configDE.currentPage > 1) {
          this.configDE.currentPage = 1;
        }
        this.mostrar_resultado = true;

      },
        error => {
          if (error.status == 400) {
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        });
    }
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

  // EXCEL

  // Función para sumar un día a la fecha
  addOneDay(date: Date): Date {
    date.setDate(date.getDate());
    return date;
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
  async exportTOExcelDist() {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitor");
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
    worksheet.getCell("B1").value = 'REPORTE - Monitor'.toUpperCase();
    worksheet.getCell("B2").value = nombreSucursal.toUpperCase();
    var fechaDesde = this.fromDateDist.nativeElement.value
      .toString()
      .trim();
    var fechaHasta = this.toDateDist.nativeElement.value
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
      if (this.todasSucursalesD || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].nombreEmpresa,
              this.addOneDay(new Date(this.servicioDist[i].Fecha)),
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }


          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "sucursal", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 }
            ]
          }


          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }



        } else {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].nombreEmpresa,

              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]

            if (incluirCajero) {
              fila.splice(1, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);

          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }


          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
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
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.addOneDay(new Date(this.servicioDist[i].Fecha)),
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }



          columnas = [
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //  worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }


        } else {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]

            if (incluirCajero) {
              fila.splice(0, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }


          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "atendidos", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }


          columnas = [
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
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


    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesD || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioDist.length; i++) {

            let fila = [
              this.servicioDist[i].nombreEmpresa,
              this.servicioDist[i].Servicio,
              this.addOneDay(new Date(this.servicioDist[i].Fecha)),
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]

          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]

          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }



        } else {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].nombreEmpresa,
              this.servicioDist[i].Servicio,
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }




          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }



          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
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
            incluirCajero ? tamanioC = 10 : tamanioC = 9
          } else {
            incluirCajero ? tamanioC = 9 : tamanioC = 8
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
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].Servicio,
              this.addOneDay(new Date(this.servicioDist[i].Fecha)),
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]

            if (incluirCajero) {
              fila.splice(0, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }


        } else {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].Servicio,
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);

          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }
          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
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

      }
    } else if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      if (this.todasSucursalesD || this.seleccionMultiple) {
        let columnas = []
        if (this.verFecha == '1') {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].nombreEmpresa,
              this.servicioDist[i].Servicio,
              this.servicioDist[i].subservicio,
              this.addOneDay(new Date(this.servicioDist[i].Fecha)),
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]

            if (incluirCajero) {
              fila.splice(1, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la primera posición
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
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            //  worksheet.columns.splice(1, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(1, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }


        } else {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].nombreEmpresa,
              this.servicioDist[i].Servicio,
              this.servicioDist[i].subservicio,
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(1, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la segunda posición
            }
            jsonServicio.push(fila);
          }



          if (incluirCajero) {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "sucursal", width: 50 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }

          columnas = [
            { name: "SUCURSAL", totalsRowLabel: "Total:", filterButton: false },
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
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
            incluirCajero ? tamanioC = 11 : tamanioC = 10
          } else {
            incluirCajero ? tamanioC = 10 : tamanioC = 9
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
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].Servicio,
              this.servicioDist[i].subservicio,
              this.addOneDay(new Date(this.servicioDist[i].Fecha)),
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }

          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "fecha", width: 20 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "FECHA", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
          ]

          if (incluirCajero) {
            // worksheet.columns.splice(0, 0, { key: "cajero", width: 20 }); // Insertar "CAJERO" en la segunda posición
            columnas.splice(0, 0, { name: "CAJERO", totalsRowLabel: "Total:", filterButton: true }); // Insertar "CAJERO" en la segunda posición
          }

        } else {
          for (let i = 0; i < this.servicioDist.length; i++) {
            let fila = [
              this.servicioDist[i].Servicio,
              this.servicioDist[i].subservicio,
              this.servicioDist[i].pendientes,
              this.servicioDist[i].en_atencion,
              this.servicioDist[i].en_pausa,
              this.servicioDist[i].atendidos,
              this.servicioDist[i].no_atendidos,
              this.servicioDist[i].turnos
            ]
            if (incluirCajero) {
              fila.splice(0, 0, this.servicioDist[i].Usuario); // Insertar "CAJERO" en la primera posición
            }
            jsonServicio.push(fila);
          }


          if (incluirCajero) {
            worksheet.columns = [
              { key: "cajero", width: 20 },
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          } else {
            worksheet.columns = [
              { key: "servicio", width: 50 },
              { key: "subservicio", width: 50 },
              { key: "pendientes", width: 20 },
              { key: "en_atencion", width: 20 },
              { key: "en_pausa", width: 20 },
              { key: "atendidos", width: 20 },
              { key: "no_atendidos", width: 20 },
              { key: "total", width: 20 },
            ]
          }

          columnas = [
            { name: "SERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "SUBSERVICIO", totalsRowLabel: "", filterButton: true },
            { name: "EN ESPERA", totalsRowLabel: "", filterButton: true },
            { name: "EN ATENCIÓN", totalsRowLabel: "", filterButton: true },
            { name: "EN PAUSA", totalsRowLabel: "", filterButton: true },
            { name: "ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "NO ATENDIDOS", totalsRowLabel: "", filterButton: true },
            { name: "TOTAL TURNOS", totalsRowLabel: "", filterButton: true },
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
            incluirCajero ? tamanioC = 10 : tamanioC = 9
          } else {
            incluirCajero ? tamanioC = 9 : tamanioC = 8
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
      FileSaver.saveAs(blob, 'dist-estadoturnos - ' + nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
    } catch (error) {
      console.error("Error al generar el archivo Excel:", error);
    }

    /*
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioDist[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Distribucion');
    XLSX.writeFile(wb, 'dist-estadoturnos - ' + nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
    */
  }

  generarPdfDist(action = 'open', pdf: number) {
    // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESIÓN EN PDF
    var fD = this.fromDateDist.nativeElement.value.toString().trim();
    var fH = this.toDateDist.nativeElement.value.toString().trim();
    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentdistribucion(fD, fH);
    }

    // OPCIONES DE PDF DE LAS CUALES SE USARA LA DE OPEN, LA CUAL ABRE EN NUEVA PESTAÑA EL PDF CREADO
    switch (action) {
      case 'open': pdfMake.createPdf(documentDefinition).open(); break;
      case 'print': pdfMake.createPdf(documentDefinition).print(); break;
      case 'download': pdfMake.createPdf(documentDefinition).download(); break;
      default: pdfMake.createPdf(documentDefinition).open(); break;
    }
  }

  // FUNCION DELEGADA PARA SETEO DE INFORMACION
  getDocumentdistribucion(fD: any, fH: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
      pageOrientation: 'landscape',
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false, fontSize: 52 },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3 },
      // SETEO DE PIE DE PAGINA, FECHA DE GENERACION DE PDF CON NUMERO DE PAGINAS
      footer: function (currentPage: any, pageCount: any, fecha: any) {
        fecha = f.toJSON().split("T")[0];
        var timer = f.toJSON().split("T")[1].slice(0, 5);
        return [
          {
            margin: [10, 20, 10, 0],
            columns: [
              'Fecha: ' + fecha + ' Hora: ' + timer,
              {
                text: [
                  {
                    text: '© Pag ' + currentPage.toString() + ' of ' + pageCount, alignment: 'right', color: 'blue', opacity: 0.5
                  }
                ],
              }
            ],
            fontSize: 9, color: '#A4B8FF',
          }
        ]
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
              width: '*',
              alignment: 'center',
              text: 'Reporte - Monitor',
              bold: true,
              fontSize: 15,
              margin: [-90, 20, 0, 0],
            }
          ]
        },
        {
          style: "subtitulos",
          text: nombreSucursal,
        },
        {
          style: 'subtitulos',
          text: 'Periodo de ' + fD + ' hasta ' + fH
        },
        this.distribucion(this.servicioDist) // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
      ],
      styles: {
        tableTotal: { fontSize: 30, bold: true, alignment: 'center', fillColor: this.p_color },
        tableHeader: { fontSize: 9, bold: true, alignment: 'center', fillColor: this.p_color },
        itemsTable: { fontSize: 8, margin: [0, 3, 0, 3], },
        itemsTableInfo: { fontSize: 10, margin: [0, 5, 0, 5] },
        subtitulos: { fontSize: 16, alignment: 'center', margin: [0, 5, 0, 10] },
        tableMargin: { margin: [0, 20, 0, 0], alignment: "center" },
        CabeceraTabla: { fontSize: 12, alignment: 'center', margin: [0, 8, 0, 8], fillColor: this.p_color },
        quote: { margin: [5, -2, 0, -2], italics: true },
        small: { fontSize: 8, color: 'blue', opacity: 0.5 }
      }
    }
  }

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF LA ESTRUCTURA
  distribucion(servicio: any[]) {
    let incluirCajero = this.selectedItems.length != 0

    if (this.serviciosSeleccionadas.length == 0) {
      if (this.todasSucursalesD || this.seleccionMultiple) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }
        } else {

          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }

        }


      } else {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*',  'auto', 'auto',  'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', 'auto',  'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }
        } else {

          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*',  'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }

        }
      }
    } else if (this.sub_serviciosSeleccionadas.length == 0 && this.serviciosSeleccionadas.length != 0) {

      if (this.todasSucursalesD || this.seleccionMultiple) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto','auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }
        } else {

          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }

        }


      } else {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto',  'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto',  'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }
        } else {

          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto',  'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }

        }
      }
    
    } else if (this.serviciosSeleccionadas.length != 0 && this.sub_serviciosSeleccionadas.length != 0) {
      console.log("entra a servicios y subservicios")
      if (this.todasSucursalesD || this.seleccionMultiple) {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }
        } else {

          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Sucursal', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.nombreEmpresa },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }

        }


      } else {
        if (this.verFecha == '1') {
          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'Fecha', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.fecha },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }
        } else {

          if (incluirCajero) {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Cajero(a)', style: 'tableHeader' },
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Usuario },
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }
          } else {
            return {
              style: 'tableMargin',
              table: {
                headerRows: 1,
                widths: ['*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Servicio', style: 'tableHeader' },
                    { text: 'Subservicio', style: 'tableHeader' },
                    { text: 'En espera', style: 'tableHeader' },
                    { text: 'En atención', style: 'tableHeader' },
                    { text: 'En pausa', style: 'tableHeader' },
                    { text: 'Atendidos', style: 'tableHeader' },
                    { text: 'No atendidos', style: 'tableHeader' },
                    { text: 'Total turnos', style: 'tableHeader' },
                  ],
                  ...servicio.map(res => {
                    return [
                      { style: 'itemsTable', text: res.Servicio },
                      { style: 'itemsTable', text: res.subservicio },
                      { style: 'itemsTable', text: res.pendientes },
                      { style: 'itemsTable', text: res.en_atencion },
                      { style: 'itemsTable', text: res.en_pausa },
                      { style: 'itemsTable', text: res.atendidos },
                      { style: 'itemsTable', text: res.no_atendidos },
                      { style: 'itemsTable', text: res.turnos },
                    ]
                  })
                ]
              },
              layout: {
                fillColor: function (rowIndex: any) {
                  return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
                }
              }
            }

          }

        }
      }
    
    }
  }

}
