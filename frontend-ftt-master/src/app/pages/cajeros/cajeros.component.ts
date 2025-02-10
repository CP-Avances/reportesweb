import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import { ToastrService } from "ngx-toastr";
import { ServiceService } from '../../services/service.service';
import { ImagenesService } from "../../shared/imagenes.service";
import { DatePipe } from '@angular/common'
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-cajeros',
  templateUrl: './cajeros.component.html',
  styleUrls: ['./cajeros.component.scss']
})
export class CajerosComponent {


  configDE: any;
  private MAX_PAGS = 10;
  cajerosSucursales = []


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
      totalItems: this.cajerosSucursales.length
    };
  }


  ngOnInit(): void {
    this.getSucursales();
    this.malRequestDistPag = true;
  }



  mostrar_resultado = false;
  // METODO PARA SELCCIONAR ESTADO DE USUARIOS
  estadoUsuario: number = 2;
  sucursales: any[];

  sucursalesSeleccionadas: string[] = [];
  // MOSTRAR CAJEROS
  mostrarCajeros: boolean = false;
  todasSucursalesD: boolean = false;
  seleccionMultiple: boolean = false;
  malRequestDistPag: boolean = false;
  malRequestDist: boolean = false;


  // PALABRAS DE COMPONENTE DE PAGINACION
  public labels: any = {
    previousLabel: 'Anterior',
    nextLabel: 'Siguiente'
  };

  // CONSULATA PARA LLENAR LA LISTA DE SURCURSALES.
  getSucursales() {
    this.serviceService.getAllSucursales().subscribe((empresas: any) => {
      this.sucursales = empresas.empresas;
    });
  }

  CambiarEstado(estado: number) {
    this.mostrar_resultado = false
    this.estadoUsuario = estado;
    this.limpiar();
  }

  limpiar() {

  }


  onSelectionChangeSucursal() {
    this.mostrar_resultado = false;
    if (!this.sucursalesSeleccionadas || this.sucursalesSeleccionadas.length === 0) {
      this.mostrarCajeros = false;
      this.selectAll('sucursalesSeleccionadas');
    }
  }

  selectAll(opcion: string) {
    switch (opcion) {
      case 'todasSucursalesD':
        this.todasSucursalesD = !this.todasSucursalesD;
        break;

      case 'sucursalesSeleccionadas':
        this.seleccionMultiple = this.sucursalesSeleccionadas.length > 1;
        break;

      default:
        break;
    }
  }

  // EVENTOS PARA AVANZAR O RETROCEDER EN LA PAGINACION
  pageChangedDE(event: any) {
    this.configDE.currentPage = event;
  }


  buscarCajeros() {
    this.serviceService.getCajerosSucursalEstado(this.sucursalesSeleccionadas, this.estadoUsuario).subscribe(
      (cajeros: any) => {
        console.log("ver resultados: ", cajeros)
        this.cajerosSucursales = cajeros.cajeros;

        this.malRequestDist = false;
        this.malRequestDistPag = false;
        // SETEO DE PAGINACION CUANDO SE HACE UNA NUEVA BUSQUEDA
        if (this.configDE.currentPage > 1) {
          this.configDE.currentPage = 1;
        }
        this.mostrar_resultado = true;
      },
      (error) => {
        if (error.status == 400) {
          this.toastr.info("No se han encontrado registros.", "Upss !!!.", {
            timeOut: 6000,
          });
        }
      }
    );
  }

  selectionCajero = new SelectionModel<any>(true, []);

  cajerosEditar: any = [];

  isAllSelectedPag() {
    const numSelected = this.selectionCajero.selected.length;
    return numSelected === this.sucursalesSeleccionadas.length
  }

  // SELECCIONA TODAS LAS FILAS SI NO ESTAN TODAS SELECCIONADAS; DE LO CONTRARIO, SELECCION CLARA.
  masterTogglePag() {
    this.isAllSelectedPag() ?
      this.selectionCajero.clear() :
      this.cajerosSucursales.forEach((row: any) => this.selectionCajero.select(row));
  }

  // LA ETIQUETA DE LA CASILLA DE VERIFICACION EN LA FILA PASADA
  checkboxLabelPag(row?: any): string {
    if (!row) {
      return `${this.isAllSelectedPag() ? 'select' : 'deselect'} all`;
    }
    this.cajerosEditar = this.selectionCajero.selected;
    return `${this.selectionCajero.isSelected(row) ? 'deselect' : 'select'} row ${row.nombre + 1}`;
  }





}
