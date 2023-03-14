import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { ServiceService } from '../../services/service.service';
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
  selector: 'app-atendidosmultiples',
  templateUrl: './atendidosmultiples.component.html',
  styleUrls: ['./atendidosmultiples.component.scss']
})
export class AtendidosmultiplesComponent implements OnInit {
  //Seteo de fechas primer dia del mes actual y dia actual
  fromDate;toDate;
  //captura de elementos de la interfaz visual para tratarlos y capturar datos
  @ViewChild('fromDateAtM') fromDateAtM: ElementRef;
  @ViewChild('toDateAtM') toDateAtM: ElementRef;
  @ViewChild('codSucursalAtM') codSucursalAtM: ElementRef;
  //Servicios-Variables donde se almacenaran las consultas a la BD
  servicioAtMul: any=[];
  sucursales: any[];
  //Variable usada en exportacion a excel
  p_color: any;
  //Banderas para mostrar la tabla correspondiente a las consultas
  todasSucursales: boolean = false;
  //Banderas para que no se quede en pantalla consultas anteriores
  malRequestAtM: boolean = false;
  malRequestAtMPag: boolean = false;
  //Usuario que ingreso al sistema
  userDisplayName: any;
  //Control paginacion
  configAtM: any;
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

  constructor(private serviceService: ServiceService,
    private auth: AuthenticationService,
    private router: Router, public datePipe: DatePipe,
    private toastr: ToastrService
  ) {
    //Seteo de item de paginacion cuantos items por pagina, desde que pagina empieza, el total de items respectivamente
    this.configAtM = {
      id: 'AtendidosMatm',
      itemsPerPage: this.MAX_PAGS,
      currentPage: 1,
      totalItems: this.servicioAtMul.length
    };
  }
  //Eventos para avanzar o retroceder en la paginacion
  pageChangedAtM(event) {
    this.configAtM.currentPage = event;
  }

  ngOnInit(): void {
    //Cargamos componentes selects HTML
    this.getlastday();
    this.getSucursales();
    //Cargamos nombre de usuario logueado
    this.userDisplayName = sessionStorage.getItem('loggedUser');
    //Seteo de banderas cuando el resultado de la peticion HTTP no es 200 OK
    this.malRequestAtMPag = true;
    //Seteo de imagen en interfaz
    Utils.getImageDataUrlFromLocalPath1('assets/logotickets.png').then(
      result => this.urlImagen = result
    )
  }

  //Se obtiene dia actual
  getlastday() {
    this.toDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    let lastweek = new Date();
    var firstDay = new Date(lastweek.getFullYear(), lastweek.getMonth(), 1);
    this.fromDate = this.datePipe.transform(firstDay, 'yyyy-MM-dd');
  }

  //Consulata para llenar la lista de surcursales.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  salir() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  //Comprueba si se realizo una busqueda por sucursales
  comprobarBusquedaSucursales(cod: string){
    return cod=="-1" ? true : false;
  }

  leerAtendidosMultiples() {
    //captura de fechas para proceder con la busqueda
    var fD = this.fromDateAtM.nativeElement.value.toString().trim();
    var fH = this.toDateAtM.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtM.nativeElement.value.toString().trim();

    this.serviceService.getatendidosmultiples(fD, fH, cod).subscribe((servicio: any) => {
      //Si se consulta correctamente se guarda en variable y setea banderas de tablas
      this.servicioAtMul = servicio.turnos;
      this.malRequestAtM = false;
      this.malRequestAtMPag = false;
      //Seteo de paginacion cuando se hace una nueva busqueda
      if (this.configAtM.currentPage > 1) {
        this.configAtM.currentPage = 1;
      }
      this.todasSucursales = this.comprobarBusquedaSucursales(cod);
    },
      error => {
        if (error.status == 400) {
          //Si hay error 400 se vacia variable y se setea banderas para que tablas no sean visisbles  de interfaz
          this.servicioAtMul = null;
          this.malRequestAtM = true;
          this.malRequestAtMPag = true;
          //Comprobacion de que si variable esta vacia pues se setea la paginacion con 0 items
          //caso contrario se setea la cantidad de elementos
          if (this.servicioAtMul == null) {
            this.configAtM.totalItems = 0;
          } else {
            this.configAtM.totalItems = this.servicioAtMul.length;
          }

          //Por error 400 se setea elementos de paginacion
          this.configAtM = {
            itemsPerPage: this.MAX_PAGS,
            currentPage: 1
          };
          //Se informa que no se encontraron registros
          this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
            timeOut: 6000,
          });
        }
      }
    );
  }

  obtenerNombreSucursal(cod: string){
    if (cod=="-1") {
      return "Todas las sucursales"
    } else {
      let nombreSucursal = (this.sucursales.find(sucursal => sucursal.empr_codigo == cod)).empr_nombre;
      return nombreSucursal;
    }
  }

  //---Excel
  exportTOExcelAtenMult() {
    let cod = this.codSucursalAtM.nativeElement.value.toString().trim();
    let nombreSucursal = this.obtenerNombreSucursal(cod);
    //Mapeo de información de consulta a formato JSON para exportar a Excel
    let jsonServicio = [];
    if (this.todasSucursales) {
      for (let step = 0; step < this.servicioAtMul.length; step++) {
        jsonServicio.push({
          Sucursal: this.servicioAtMul[step].nombreEmpresa,
          Usuario: this.servicioAtMul[step].Usuario,
          Atendidos: this.servicioAtMul[step].Atendidos
        });
      }
    } else {
      for (let step = 0; step < this.servicioAtMul.length; step++) {
        jsonServicio.push({
          Usuario: this.servicioAtMul[step].Usuario,
          Atendidos: this.servicioAtMul[step].Atendidos
        });
      }
    }
    //Instrucción para generar excel a partir de JSON, y nombre del archivo con fecha actual
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonServicio);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    // METODO PARA DEFINIR TAMAÑO DE LAS COLUMNAS DEL REPORTE
    const header = Object.keys(this.servicioAtMul[0]); // NOMBRE DE CABECERAS DE COLUMNAS
    var wscols = [];
    for (var i = 0; i < header.length; i++) {  // CABECERAS AÑADIDAS CON ESPACIOS
      wscols.push({ wpx: 150 })
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, 'Atencion');
    XLSX.writeFile(wb, 'atendidosmultiples - '+nombreSucursal + ' - ' + new Date().toLocaleString() + EXCEL_EXTENSION);
  }

  //---PDF
  generarPdfAtendMult(action = 'open', pdf: number) {
    //Seteo de rango de fechas de la consulta para impresión en PDF
    var fD = this.fromDateAtM.nativeElement.value.toString().trim();
    var fH = this.toDateAtM.nativeElement.value.toString().trim();
    var cod = this.codSucursalAtM.nativeElement.value.toString().trim();
    //Definicion de funcion delegada para setear estructura del PDF
    let documentDefinition;
    if (pdf === 1) {
      documentDefinition = this.getDocumentatendidosmultiples(fD, fH, cod);
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
  getDocumentatendidosmultiples(fD, fH, cod) {
    //Se obtiene la fecha actual
    let f = new Date();
    f.setUTCHours(f.getHours())
    this.date = f.toJSON();
    let nombreSucursal = this.obtenerNombreSucursal(cod);

    return {
      //Seteo de marca de agua y encabezado con nombre de usuario logueado
      watermark: { text: 'FullTime Tickets', color: 'blue', opacity: 0.1, bold: true, italics: false, fontSize: 52 },
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
              height: 40,
            },
            {
              width: '*',
              alignment: 'center',
              text: 'Reporte - Atendidos Múltiples',
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
          text: 'Periodo  de ' + fD + ' hasta ' + fH
        },
        this.atendidosmult(this.servicioAtMul)//Definicion de funcion delegada para setear informacion de tabla del PDF
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
  atendidosmult(servicio: any[]) {
    if (this.todasSucursales) {
      return {
        style: 'tableMargin',
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
  
          body: [
            [
              { text: 'Sucursal', style: 'tableHeader' },
              { text: 'Usuario', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
  
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.nombreEmpresa },
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.Atendidos }
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
          widths: ['*', '*'],
  
          body: [
            [
              { text: 'Usuario', style: 'tableHeader' },
              { text: 'Atendidos', style: 'tableHeader' },
  
            ],
            ...servicio.map(res => {
              return [
                { style: 'itemsTable', text: res.Usuario },
                { style: 'itemsTable', text: res.Atendidos }
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
