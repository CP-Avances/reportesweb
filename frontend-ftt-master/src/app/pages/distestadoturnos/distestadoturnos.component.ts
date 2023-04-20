import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { ServiceService } from '../../services/service.service';
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from '../../services/authentication.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common'
import { ToastrService } from "ngx-toastr";

//Complementos para PDF y Excel
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
  //Seteo de fechas primer dia del mes actual y dia actual
  fromDate;toDate;

  //captura de elementos de la interfaz visual para tratarlos y capturar datos
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

  //Servicios-Variables donde se almacenaran las consultas a la BD
  servicioDist: any = [];
  servicioRes: any = [];
  sucursales: any[];

  //Variable usada en exportacion a excel
  p_color: any;

  //Banderas para mostrar la tabla correspondiente a las consultas
  todasSucursalesD: boolean = false;
  todasSucursalesR: boolean = false;

  //Banderas para que no se quede en pantalla consultas anteriores
  cajerosDist: any = [];
  malRequestDist: boolean = false;
  malRequestDistPag: boolean = false;
  malRequestDistRes: boolean = false;
  malRequestDistPagRes: boolean = false;

  //Usuario que ingreso al sistema
  userDisplayName: any;

  //Control paginacion
  configDE: any;
  configDERes: any;
  private MAX_PAGS = 10;

  //Palabras de componente de paginacion
  public labels: any = {
    previousLabel: 'Anterior',
    nextLabel: 'Siguiente'
  };

  //Obtiene fecha actual para colocarlo en cuadro de fecha
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year+"-"+this.month+"-"+this.day;

  //Imagen Logo
  urlImagen: string;

  //OPCIONES MULTIPLES
  allSelected = false;
  selectedItems: string[] = [];
  sucursalesSeleccionadas: string[] = [];
  seleccionMultiple: boolean = false;

  //MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;

  //Informacion
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  constructor(private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router, public datePipe: DatePipe,
    private toastr: ToastrService,
    private imagenesService: ImagenesService
  ) {
    //Seteo de item de paginacion cuantos items por pagina, desde que pagina empieza, el total de items respectivamente
    this.configDE = {
      id: 'disestde',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioDist.length
    };
    this.configDERes = {
      id: 'disestderes',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioRes.length
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }
  //Eventos para avanzar o retroceder en la paginacion
  pageChangedDE(event) {
    this.configDE.currentPage = event;
  }
  pageChangedDERes(event) {
    this.configDERes.currentPage = event;
  }

  ngOnInit(): void {
    //Cargamos componentes selects HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    //Cargamos nombre de usuario logueado
    this.userDisplayName = sessionStorage.getItem('loggedUser');
    //Seteo de banderas cuando el resultado de la peticion HTTP no es 200 OK
    this.malRequestDistPag = true;
    this.malRequestDistPagRes = true;
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
        case 'allSelected':
            this.allSelected = !this.allSelected;
            break;
        case 'todasSucursalesD':
            this.todasSucursalesD = !this.todasSucursalesD;
            this.todasSucursalesD ? this.getCajeros(this.sucursalesSeleccionadas) : null;
            break;
        case 'todasSucursalesR':
            this.todasSucursalesR = !this.todasSucursalesR;
            this.todasSucursalesR ? this.getCajeros(this.sucursalesSeleccionadas) : null;
            break;
        case 'sucursalesSeleccionadas':
            this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
            this.sucursalesSeleccionadas.length > 0 ? this.getCajeros(this.sucursalesSeleccionadas) : null;
            break;
        default:
            break;
    }
  }

  //Se desloguea de la aplicacion
  salir(){
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  //Se obtiene la fecha actual
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, 'yyyy-MM-dd');
  }

  //Se obtiene cajeros-usuarios existentes
  getCajeros(sucursal: any) {
    this.serviceService.getAllCajerosS(sucursal).subscribe((cajerosDist: any) => {
      this.cajerosDist = cajerosDist.cajeros;
      this.mostrarCajeros = true;
    },
    (error)=>{
      if (error.status == 400) {
        this.cajerosDist=[];
        this.mostrarCajeros = false;
      }
    });
  }

  limpiar() {
    this.cajerosDist=[];
    this.mostrarCajeros = false;
    this.selectedItems = [];
    this.allSelected = false;
    this.todasSucursalesD = false;
    this.todasSucursalesR = false;
    this.seleccionMultiple = false;
    this.sucursalesSeleccionadas = [];
  }

  //Comprueba si se realizo una busqueda por sucursales
  comprobarBusquedaSucursales(cod: string){
    return cod=="-1" ? true : false;
  }
  
  //Consulata para llenar la lista de surcursales.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  leerDistribucionTurnos() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateDist.nativeElement.value.toString().trim();
    var fH = this.toDateDist.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioD.nativeElement.value;
    let horaFin = this.horaFinD.nativeElement.value;

    if (this.selectedItems.length!==0) { 
      this.serviceService.getdistribucionturnos(fD, fH, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas).subscribe((servicio: any) => {
        //Si se consulta correctamente se guarda en variable y setea banderas de tablas
        this.servicioDist = servicio.turnos;
        this.malRequestDist = false;
        this.malRequestDistPag = false;
        //Seteo de paginacion cuando se hace una nueva busqueda
        if (this.configDE.currentPage > 1) {
          this.configDE.currentPage = 1;
        }
      },
        error => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioDist = null;
            this.malRequestDist = true;
            this.malRequestDistPag = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioDist == null) {
              this.configDE.totalItems = 0;
            } else {
              this.configDE.totalItems = this.servicioDist.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configDE = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1
            };
            //Se informa que no se encontraron registros
            this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
              timeOut: 6000,
            });
          }
        });
    }
  }

  leerDistribucionTurnosResumen() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateDistRes.nativeElement.value.toString().trim();
    var fH = this.toDateDistRes.nativeElement.value.toString().trim();
    let horaInicio = this.horaInicioR.nativeElement.value;
    let horaFin = this.horaFinR.nativeElement.value;
    
    if (this.selectedItems.length!==0) { 
      this.serviceService.getdistribucionturnosresumen(fD, fH, horaInicio, horaFin, this.selectedItems, this.sucursalesSeleccionadas).subscribe((servicioRes: any) => {
        //Si se consulta correctamente se guarda en variable y setea banderas de tablas
        this.servicioRes = servicioRes.turnos;
        this.malRequestDistPagRes = false;
        this.malRequestDistRes = false;
        //Seteo de paginacion cuando se hace una nueva busqueda
        if (this.configDERes.currentPage > 1) {
          this.configDERes.currentPage = 1;
        }
      },
        error => {
          if (error.status == 400) {
            //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
            this.servicioRes = null;
            this.malRequestDistRes = true;
            this.malRequestDistPagRes = true;
            //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
            //caso contrario se setea la cantidad de elementos
            if (this.servicioRes == null) {
              this.configDERes.totalItems = 0;
            } else {
              this.configDERes.totalItems = this.servicioRes.length;
            }
            //Por error 400 se setea elementos de paginacion
            this.configDERes = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1
            };
            //Se informa que no se encontraron registros
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

  //---Excel
  exportTOExcelDist() {
    // let cod = this.codSucursalDist.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesD || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioDist.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioDist[step].nombreEmpresa,
          "Cajero(a)": this.servicioDist[step].Usuario,
          Servicio: this.servicioDist[step].SERV_NOMBRE,
          Fecha: this.servicioDist[step].fecha,
          Pendientes: this.servicioDist[step].PENDIENTES,
          "En atención": this.servicioDist[step].EN_ATENCION,
          "En pausa": this.servicioDist[step].EN_PAUSA,
          Atendidos: this.servicioDist[step].ATENDIDOS,
          "No atendidos": this.servicioDist[step].NOATENDIDOS,
          "Total turnos": this.servicioDist[step].turnos,
        });
      }
    } else {
      for (let step = 0; step < this.servicioDist.length; step++) {
        jsonServicio.push({
          "Cajero(a)": this.servicioDist[step].Usuario,
          Servicio: this.servicioDist[step].SERV_NOMBRE,
          Fecha: this.servicioDist[step].fecha,
          Pendientes: this.servicioDist[step].PENDIENTES,
          "En atención": this.servicioDist[step].EN_ATENCION,
          "En pausa": this.servicioDist[step].EN_PAUSA,
          Atendidos: this.servicioDist[step].ATENDIDOS,
          "No atendidos": this.servicioDist[step].NOATENDIDOS,
          "Total turnos": this.servicioDist[step].turnos,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioDist[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Distribucion');
    XLSX.writeFile(wb, 'dist-estadoturnos - ' + nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
  }

  exportTOExcelRes() {
    // let cod = this.codSucursalDistRes.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursalesR || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioRes.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioRes[step].nombreEmpresa,
          "Cajero(a)": this.servicioRes[step].Usuario,
          Servicio: this.servicioRes[step].SERV_NOMBRE,
          Pendientes: this.servicioRes[step].PENDIENTES,
          "En atención": this.servicioRes[step].EN_ATENCION,
          "En pausa": this.servicioRes[step].EN_PAUSA,
          Atendidos: this.servicioRes[step].ATENDIDOS,
          "No atendidos": this.servicioRes[step].NOATENDIDOS,
          "Total turnos": this.servicioRes[step].turnos,
        });
      }
    } else {
      for (let step = 0; step < this.servicioRes.length; step++) {
        jsonServicio.push({
          "Cajero(a)": this.servicioRes[step].Usuario,
          Servicio: this.servicioRes[step].SERV_NOMBRE,
          Pendientes: this.servicioRes[step].PENDIENTES,
          "En atención": this.servicioRes[step].EN_ATENCION,
          "En pausa": this.servicioRes[step].EN_PAUSA,
          Atendidos: this.servicioRes[step].ATENDIDOS,
          "No atendidos": this.servicioRes[step].NOATENDIDOS,
          "Total turnos": this.servicioRes[step].turnos,
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioRes[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
    XLSX.writeFile(wb, 'dist-estadoturnos-res - ' +nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
  }

  generarPdfDist(action = 'open', pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fD = this.fromDateDist.nativeElement.value.toString().trim();
    var fH = this.toDateDist.nativeElement.value.toString().trim();
    // var cod = this.codSucursalDist.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentdistribucion(fD, fH);
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
    switch (action) {
      case 'open': pdfMake.createPdf(documentDefinition).open(); break;
      case 'print': pdfMake.createPdf(documentDefinition).print(); break;
      case 'download': pdfMake.createPdf(documentDefinition).download(); break;

      default: pdfMake.createPdf(documentDefinition).open(); break;
    }
  }

  //Funcion delegada para seteo de información
  getDocumentdistribucion(fD, fH) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false, fontSize: 52 },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3 },
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
              width: '*',
              alignment: 'center',
              text: 'Reporte - Distribucion y estado de turnos',
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
        this.distribucion(this.servicioDist)//Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  distribucion(servicio: any[]) {
    if (this.todasSucursalesD || this.seleccionMultiple) {
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
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'Pendientes', style: 'tableHeader' },
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
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.fecha },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos },
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    } else {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Cajero(a)', style: 'tableHeader' },
              { text: 'Servicio', style: 'tableHeader' },
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'Pendientes', style: 'tableHeader' },
              { text: 'En atención', style: 'tableHeader' },
              { text: 'En pausa', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
              { text: 'No atendidos', style: 'tableHeader' },
              { text: 'Total turnos', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.fecha },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos },
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    }
  }

  generarPdfRes(action = 'open', pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fD = this.fromDateDistRes.nativeElement.value.toString().trim();
    var fH = this.toDateDistRes.nativeElement.value.toString().trim();
    // var cod = this.codSucursalDistRes.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentDistribucionRes(fD, fH);
    }

    //Opciones de PDF de las cuales se usara la de open, la cual abre en nueva pestaña el PDF creado
    switch (action) {
      case 'open': pdfMake.createPdf(documentDefinition).open(); break;
      case 'print': pdfMake.createPdf(documentDefinition).print(); break;
      case 'download': pdfMake.createPdf(documentDefinition).download(); break;

      default: pdfMake.createPdf(documentDefinition).open(); break;
    }
  }

  //Funcion delegada para seteo de información
  getDocumentDistribucionRes(fD, fH) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: { text: this.marca, color: 'blue', opacity: 0.1, bold: true, italics: false, fontSize: 52 },
      header: { text: 'Impreso por:  ' + this.userDisplayName, margin: 10, fontSize: 9, opacity: 0.3 },
      //Seteo de pie de pagina, fecha de generacion de PDF con numero de paginas
      footer: function (currentPage, pageCount, fecha) {
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
              width: '*',
              alignment: 'center',
              text: 'Reporte - Resumen Distribucion y turnos',
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
        this.distribucionRes(this.servicioRes)//Definicion de funcion delegada para setear informacion de tabla del PDF
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

  //Definicion de funcion delegada para setear informacion de tabla del PDF la estructura
  distribucionRes(servicio: any[]) {
    if (this.todasSucursalesR || this.seleccionMultiple) {
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
              { text: 'Pendientes', style: 'tableHeader' },
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
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos }
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    } else {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Cajero(a)', style: 'tableHeader' },
              { text: 'Servicio', style: 'tableHeader' },
              { text: 'Pendientes', style: 'tableHeader' },
              { text: 'En atención', style: 'tableHeader' },
              { text: 'En pausa', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
              { text: 'No atendidos', style: 'tableHeader' },
              { text: 'Total turnos', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.SERV_NOMBRE },
                { style: 'itemsTable', text: res.PENDIENTES },
                { style: 'itemsTable', text: res.EN_ATENCION },
                { style: 'itemsTable', text: res.EN_PAUSA },
                { style: 'itemsTable', text: res.ATENDIDOS },
                { style: 'itemsTable', text: res.NOATENDIDOS },
                { style: 'itemsTable', text: res.turnos }
              ]
            })
          ]
        },
        layout: {
          fillColor: function (rowIndex) {
            return (rowIndex % 2 === 0) ? '#E5E7E9' : null;
          }
        }
      }
    }
  }

}
