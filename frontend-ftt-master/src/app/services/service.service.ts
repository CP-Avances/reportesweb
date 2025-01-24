import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { servicio, subservicio } from '../models/servicio';
import { empresa } from '../models/empresa';
import { cajero } from '../models/cajero';

@Injectable({
  providedIn: 'root'
})

export class ServiceService {

  private URL = "http://10.1.0.21:3004";

  constructor(
    private http: HttpClient
  ) { }

  /** ****************************************************************************************************************** **
   ** **                                        TURNOS POR FECHAS                                                     ** **
   ** ****************************************************************************************************************** **/

  getfiltroturnosfechas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any, servicios: any, subservicios: any, estado: any): Observable<servicio[]> {
    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + 0 + "/" + 0 + "/" + estado);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + 0+ "/" + estado);    
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + subservicios + "/" + estado);
    }

  }


  /** ****************************************************************************************************************** **
   ** **                                        TURNOS TOTALES POR FECHAS                                             ** **
   ** ****************************************************************************************************************** **/

  getturnostotalfechas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any, servicios: any, subservicios: any, estado: any): Observable<servicio[]> {


    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + 0 + "/" + 0+ "/" + estado);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + 0+ "/" + estado);
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + subservicios+ "/" + estado);

    }


  }


  /** ****************************************************************************************************************** **
   ** **                                         TURNOS META                                                          ** **
   ** ****************************************************************************************************************** **/

  getturnosMeta(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any, servicios: any, subservicios: any, estado: any): Observable<servicio[]> {
  
    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + 0 + "/" + 0+ "/" + estado);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + 0+ "/" + estado);
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + subservicios+ "/" + estado);
    }
  }

  setMeta(valor: number) {
    return this.http.get<any>(`${this.URL}/setMeta/${valor}`);
  }

  getMeta(): Observable<any> {
    return this.http.get<any>(this.URL + "/getMeta");
  }


  /** ****************************************************************************************************************** **
   ** **                                               USUARIOS                                                       ** **
   ** ****************************************************************************************************************** **/

  getturnosfecha(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha");
  }

  getAllSucursales(): Observable<empresa[]> {
    return this.http.get<empresa[]>(this.URL + "/getallsucursales");
  }

  getAllCategorias(tipo: any): Observable<any> {
    return this.http.get<any>(this.URL + "/categorias/" + tipo);
  }

  getAllCajeros(): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros");
  }

  // METODO PARA BUSCAR CAJEROS SEGUN SU ESTADO
  getAllCajerosEstado(estado: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/cajerosEstado/" + estado);
  }

  getAllCajerosS(sucursales: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + sucursales);
  }

  // METODO PARA BUSCAR CAJEROS SEGUN SUCURSALES Y ESTADO
  getCajerosSucursalEstado(sucursales: any, estado: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + sucursales + "/" + estado);
  }

  getAllServicios(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios");
  }

  getAllServiciosS(sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios" + "/" + sucursales);
  }

  getAllSub_serviciosS(servicios: any): Observable<subservicio[]> {
    return this.http.get<subservicio[]>(this.URL + "/getallsub_servicios" + "/" + servicios);
    // METODO PARA BUSCAR SUBSERVICIOS DE ACUERDO AL SERVICIO
  }

  getAllSubservicios(servicio: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallSubservicios" + "/" + servicio);
  }


  /** ************************************************************************************************************ **
   ** **                                    TIEMPO PROMEDIO DE ATENCION                                         ** ** 
   ** ************************************************************************************************************ **/

  getturnosF(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, servicios: any, subservicios: any, estado: any): Observable<servicio[]> {
    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + 0 + "/" + 0+ "/" + estado);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + 0+ "/" + estado);
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + subservicios+ "/" + estado);
    }
  }

  getturnosAtencion(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempoatencionturnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getentradassalidasistema(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  getatencionusuario(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario");
  }

  getatencionusuarios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }
  getfiltroturnosfecha(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha/" + fecha);
  }


  /** ****************************************************************************************************************** **
   ** **                                          EVALUACION                                                          ** **
   ** ****************************************************************************************************************** **/

  getPromediosEvaluacionFechas(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, subservicio: any, cajero: any, opcion: string, estado: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedios/fechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + subservicio + "/" + cajero + "/" + opcion + "/" + estado);
  }

  getmaxminservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + opcion);
  }

  getprmediosempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediose/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion);
  }

  getevalomitidasempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/omitidas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getmaxminempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimose/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion);
  }

  getgraficobarras(opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarras" + "/" + opcion);
  }

  getgraficobarrasfiltro(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarrasfiltro/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion);
  }

  getgraficopastel(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficopastel");
  }

  getestablecimiento(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/establecimiento/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + opcion);
  }

  getevalgrupo(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluaciongrupos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion);
  }


  /** ****************************************************************************************************************** **
   ** **                                            ATENCION                                                          ** **
   ** ****************************************************************************************************************** **/

  gettiemposcompletos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiemposcompletos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getclientes(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/cliente/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getpromatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales);
  }

  gettiempoatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempoatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales);
  }

  getmaxatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maxatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales);
  }

  getatencionservicio(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionservicio/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getatenciongrafico(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoservicio/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }


  /** ****************************************************************************************************************** **
   ** **                                           OCUPACION                                                          ** **
   ** ****************************************************************************************************************** **/

  getocupacionservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ocupacionservicios/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  getgraficoocupacion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }


  /** ****************************************************************************************************************** **
   ** **                                         DISTRIBUCION Y ESTADO DE TURNOS                                      ** **
   ** ****************************************************************************************************************** **/

  getdistribucionturnos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getdistribucionturnosresumen(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturnoresumen/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }


  /** ****************************************************************************************************************** **
   ** **                                           INGRESO DE CLIENTES                                                ** **
   ** ****************************************************************************************************************** **/

  getingresoclientes(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientes/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }


  /** ****************************************************************************************************************** **
   ** **                                          ATENDIDOS MULTIPLES                                                 ** **
   ** ****************************************************************************************************************** **/

  getatendidosmultiples(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atendidosmultiples/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }


  /** ****************************************************************************************************************** **
   ** **                                           OPINIONES                                                          ** **
   ** ****************************************************************************************************************** **/

  getopiniones(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos);
  }

  getopinionesIC(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any, categorias: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinionIC/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos + "/" + categorias);
  }

  getgraficoopinion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  getgraficoopinionesIC(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinionIC/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos);
  }


  /** ****************************************************************************************************************** **
   ** **                                           GRAFICOS MENU                                                      ** **
   ** ****************************************************************************************************************** **/

  getatencionusuariomenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fecha);
  }

  getpromediosatencionmenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencionmenu/" + fecha);
  }

  getingresoclientesmenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientesmenu/" + fecha);
  }


  /** ****************************************************************************************************************** **
   ** **                                         GRAFICOS EXTRA MENU                                                  ** **
   ** ****************************************************************************************************************** **/

  gettotaltickets(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totaltickets/" + fecha);
  }

  gettotalatendidos(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totalatendidos/" + fecha);
  }

  gettotalsinatender(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totalsinatender/" + fecha);
  }

  getpromedioatencion(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedioatencion/" + fecha);
  }

  getgrafeva(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evagraf");
  }

  getserviciossolicitados(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/servsoli");
  }

  getOpcionesEvaluacion(): Observable<any> {
    return this.http.get<any>(this.URL + "/opcionesEvaluacion");
  }

  getIdentificacionCliente(): Observable<any> {
    return this.http.get<any>(this.URL + "/identificacionCliente");
  }

  getturnos(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion");
  }

  setImagen(formdata: any) {
    return this.http.post<any>(`${this.URL}/uploadImage`, formdata);
  }

  getImagen(): Observable<any> {
    return this.http.get<any>(this.URL + "/nombreImagen");
  }


  /** ****************************************************************************************************************** **
   ** **                                         MARCA DE AGUA REPORTES                                               ** **
   ** ****************************************************************************************************************** **/

  setMarca(marca: string) {
    return this.http.get<any>(`${this.URL}/setMarca/${marca}`);
  }

  getMarca(): Observable<any> {
    return this.http.get<any>(this.URL + "/getMarca");
  }

}
