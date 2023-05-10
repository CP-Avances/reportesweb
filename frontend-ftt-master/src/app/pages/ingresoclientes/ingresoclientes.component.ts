import { Component, OnInit, ViewChild,ElementRef } from '@angular/core';
import { ToastrService } from "ngx-toastr";
import { DatePipe } from '@angular/common'
import { Router } from '@angular/router';

import { ServiceService } from '../../services/service.service';
import { ImagenesService } from "../../shared/imagenes.service";
import { AuthenticationService } from '../../services/authentication.service';

// COMPLEMENTOS PARA PDF Y EXCEL
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Utils } from '../../utils/util';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
import * as XLSX from 'xlsx';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-ingresoclientes',
  templateUrl: './ingresoclientes.component.html',
  styleUrls: ['./ingresoclientes.component.scss']
})

export class IngresoclientesComponent implements OnInit {
  // SETEO DE FECHAS PRIMER DIA DEL MES ACTUAL Y DIA ACTUAL
  fromDate: any;
  toDate: any;

  // CAPTURA DE ELEMENTOS DE LA INTERFAZ VISUAL PARA TRATARLOS Y CAPTURAR DATOS
  @ViewChild('fromDateIng') fromDateIng: ElementRef;
  @ViewChild('toDateIng') toDateIng: ElementRef;
  @ViewChild('codSucursalIngreso') codSucursalIngreso: ElementRef;

  @ViewChild("horaInicioI") horaInicioI: ElementRef;
  @ViewChild("horaFinI") horaFinI: ElementRef;


  // SERVICIOS-VARIABLES DONDE SE ALMACENARAN LAS CONSULTAS A LA BD
  servicioIngrClientes: any = [];
  sucursales: any[];

  // VARIABLE USADA EN EXPORTACION A EXCEL
  p_color: any;

  // BANDERAS PARA MOSTRAR LA TABLA CORRESPONDIENTE A LAS CONSULTAS
  todasSucursales: boolean = false;

  // BANDERAS PARA QUE NO SE QUEDE EN PANTALLA CONSULTAS ANTERIORES
  malRequestIng: boolean = false;
  malRequestIngPag: boolean = false;

  // USUARIO QUE INGRESO AL SISTEMA
  userDisplayName: any;

  // CONTROL PAGINACION
  configTE: any;
  private MAX_PAGS = 10;

  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: 'Anterior',
    nextLabel: 'Siguiente'
  };

  // OBTIENE FECHA ACTUAL para colocarlo en cuadro de fecha
  day = new Date().getDate();
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();
  date = this.year+"-"+this.month+"-"+this.day;

  // IMAGEN LOGO
  urlImagen: string;

  // OPCIONES MULTIPLES
  sucursalesSeleccionadas: string[] = [];
  seleccionMultiple: boolean = false;

  // INFORMACION
  marca: string = "FullTime Tickets";
  horas: number[] = [];

  constructor(
    private imagenesService: ImagenesService, 
    private serviceService: ServiceService,
    private router: Router, public datePipe: DatePipe,
    private toastr: ToastrService,
    private auth: AuthenticationService,
    ) {
    // SETEO DE ITEM DE PAGINACION CUANTOS ITEMS POR PAGINA, DESDE QUE PAGINA EMPIEZA, EL TOTAL DE ITEMS RESPECTIVAMENTE
    this.configTE = {
      id: 'IngClite',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioIngrClientes.length
    };

    for (let i = 0; i <= 24; i++) {
      this.horas.push(i);
    }
  }
  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedTE(event: any) {
    this.configTE.currentPage = event;
  }

  ngOnInit(): void {
    // CARGAMOS COMPONENTES SELECTS HTML
    this.getlastday();
    this.getSucursales();
    this.getMarca();
    // CARGAMOS NOMBRE DE USUARIO LOGUEADO
    this.userDisplayName = sessionStorage.getItem('loggedUser');
    // SETEO DE BANDERAS CUANDO EL RESULTADO DE LA PETICION HTTP NO ES 200 OK
    this.malRequestIngPag = true;
    // CARGAR LOGO PARA LOS REPORTES
    this.imagenesService.cargarImagen().then((result: any) => {
      this.urlImagen = result;
    }).catch((error) => {
      Utils.getImageDataUrlFromLocalPath1("assets/logotickets.png").then(
        (result) => (this.urlImagen = result)
      );
    });
  }

  selectAll(opcion: string) {
    switch (opcion) {
        case 'todasSucursales':
            this.todasSucursales = !this.todasSucursales;
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

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }

  // OBTIENE LA FECHA ACTUAL
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, 'yyyy-MM-dd');
  }

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  // SE DESLOGUEA DE LA APLICACION
  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  // COMPRUEBA SI SE REALIZO UNA BUSQUEDA POR SUCURSALES
  comprobarBusquedaSucursales(cod: string){
    return cod=="-1" ? true : false;
  }

  leerIngresoClientes() {
    // CAPTURA DE FECHAS PARA PROCEDER CON LA BUSQUEDA
    var fD = this.fromDateIng.nativeElement.value.toString().trim();
    var fH = this.toDateIng.nativeElement.value.toString().trim();
    
    let horaInicio = this.horaInicioI.nativeElement.value;
    let horaFin = this.horaFinI.nativeElement.value;

    if (this.sucursalesSeleccionadas.length!==0) {
      this.serviceService.getingresoclientes(fD, fH, horaInicio, horaFin, this.sucursalesSeleccionadas).subscribe((servicio: any) => {
        // SI SE CONSULTA CORRECTAMENTE SE GUARDA EN VARIABLE Y SETEA BANDERAS DE TABLAS
        this.servicioIngrClientes = servicio.turnos;
        this.malRequestIng = false;
        this.malRequestIngPag = false;
        // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
        if (this.configTE.currentPage > 1) {
          this.configTE.currentPage = 1;
        }
      },
        error => {
          if (error.status == 400) {
            // SI HAY ERROR 400 SE VACIA VARIABLE Y SE SETEA BANDERAS PARA QUE TABLAS NO SEAN VISISBLES  DE INTERFAZ
            this.servicioIngrClientes = null;
            this.malRequestIng = true;
            this.malRequestIngPag = true;
            /** COMPROBACION DE QUE SI VARIABLE ESTA VACIA PUES SE SETEA LA PAGINACION CON 0 ITEMS 
             *  CASO CONTRARIO SE SETEA LA CANTIDAD DE ELEMENTOS
             **/ 
            if (this.servicioIngrClientes == null) {
              this.configTE.totalItems = 0;
            } else {
              this.configTE.totalItems = this.servicioIngrClientes.length;
            }
            // POR ERROR 400 SE SETEA ELEMENTOS DE PAGINACION
            this.configTE = {
              itemsPerPage: this.MAX_PAGS,
              currentPage: 1
            };
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

  // EXCEL
  exportTOExcelIngrClientes() {
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);
    // MAPEO DE INFORMACIÓN DE CONSULTA A FORMATO JSON PARA EXPORTAR A EXCEL
    let jsonServicio: any = [];
    if (this.todasSucursales || this.seleccionMultiple) {
      for (let step = 0; step < this.servicioIngrClientes.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioIngrClientes[step].nombreEmpresa,
          Fecha: new Date(this.servicioIngrClientes[step].Fecha),
          "Total Clientes": this.servicioIngrClientes[step].clientes
        });
      }
    } else {
      for (let step = 0; step < this.servicioIngrClientes.length; step++) {
        jsonServicio.push({
          Fecha: new Date(this.servicioIngrClientes[step].Fecha),
          "Total Clientes": this.servicioIngrClientes[step].clientes
        });
      }
    }
    // INSTRUCCION PARA GENERAR EXCEL A PARTIR DE JSON, Y NOMBRE DEL ARCHIVO CON FECHA ACTUAL
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioIngrClientes[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols: any = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Ingreso');
    XLSX.writeFile(wb, 'ingresoclientes - '+ nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
  }

  generarPdfIngrClientes(action = 'open', pdf: number) {
     // SETEO DE RANGO DE FECHAS DE LA CONSULTA PARA IMPRESION EN PDF
    var fD = this.fromDateIng.nativeElement.value.toString().trim();
    var fH = this.toDateIng.nativeElement.value.toString().trim();

    // DEFINICION DE FUNCION DELEGADA PARA SETEAR ESTRUCTURA DEL PDF
    let documentDefinition: any;
    if (pdf === 1) {
      documentDefinition = this.getDocumentIngtesoClientes(fD, fH);
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
  getDocumentIngtesoClientes(fD: any, fH: any) {
    // SE OBTIENE LA FECHA ACTUAL
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(this.sucursalesSeleccionadas);

    return {
      // SETEO DE MARCA DE AGUA Y ENCABEZADO CON NOMBRE DE USUARIO LOGUEADO
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
              text: 'Reporte - Ingreso de Clientes',
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
        this.ingresoclientes(this.servicioIngrClientes)// DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF
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

  // DEFINICION DE FUNCION DELEGADA PARA SETEAR INFORMACION DE TABLA DEL PDF la estructura
  ingresoclientes(servicio: any[]) {
    if (this.todasSucursales || this.seleccionMultiple) {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Sucursal.', style: 'tableHeader' },
              { text: 'Fecha.', style: 'tableHeader' },
              { text: 'Total Clientes', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.nombreEmpresa },
                { style: 'itemsTable', text: res.Fecha },
                { style: 'itemsTable', text: res.clientes }
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
          widths: ['*', '*'],
          body: [
            [
              { text: 'Fecha.', style: 'tableHeader' },
              { text: 'Total Clientes', style: 'tableHeader' },
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.Fecha },
                { style: 'itemsTable', text: res.clientes }
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
