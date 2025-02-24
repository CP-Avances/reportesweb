import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { servicio } from '../models/servicio';
import { empresa } from '../models/empresa';
import { cajero } from '../models/cajero';

@Injectable({
  providedIn: 'root'
})

export class ServiceService {

  private URL = "http://192.168.0.145:3004";

  constructor(
    private http: HttpClient
  ) { }

  /** ****************************************************************************************************************** **
   ** **                                        TURNOS TOTALES POR FECHAS                                             ** **
   ** ****************************************************************************************************************** **/

  getturnostotalfechas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any, servicios: any, subservicios: any, estado: any, fecha: string): Observable<servicio[]> {
    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + 0 + "/" + 0 + "/" + estado + "/" + fecha);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + 0 + "/" + estado + "/" + fecha);
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + subservicios + "/" + estado + "/" + fecha);
    }
  }


  /** ****************************************************************************************************************** **
   ** **                                         TURNOS META                                                          ** **
   ** ****************************************************************************************************************** **/

  getturnosMeta(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any, servicios: any, subservicios: any, estado: any): Observable<servicio[]> {

    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + 0 + "/" + 0 + "/" + estado);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + 0 + "/" + estado);
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + subservicios + "/" + estado);
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

  getAllSucursales(): Observable<empresa[]> {
    return this.http.get<empresa[]>(this.URL + "/getallsucursales");
  }

  getAllCategorias(tipo: any): Observable<any> {
    return this.http.get<any>(this.URL + "/categorias/" + tipo);
  }


  // METODO PARA BUSCAR CAJEROS SEGUN SUCURSALES Y ESTADO
  getCajerosSucursalEstado(sucursales: any, estado: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + sucursales + "/" + estado);
  }

  // METODO PARA BUSCAR CAJEROS SEGUN SUCURSALES Y ESTADO
  actualizarEstadoCajerosSucursalEstado(sucursales: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/cambiarestadocajeros/" + sucursales);
  }

  getAllServiciosS(sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios" + "/" + sucursales);
  }

  getAllSubservicios(servicio: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallSubservicios" + "/" + servicio);
  }


  /** ************************************************************************************************************ **
   ** **                                    TIEMPO PROMEDIO DE ATENCION                                         ** ** 
   ** ************************************************************************************************************ **/

  getturnosF(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, servicios: any, subservicios: any, estado: any, fecha: string): Observable<servicio[]> {
    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + 0 + "/" + 0 + "/" + estado + "/" + fecha);
    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + 0 + "/" + estado + "/" + fecha);
    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + subservicios + "/" + estado + "/" + fecha);
    }
  }

  getturnosAtencion(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, servicios: any, subservicios: any, estado: any): Observable<servicio[]> {
    if (servicios.length == 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempoatencionturnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + 0 + "/" + 0 + "/" + estado);

    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempoatencionturnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + 0 + "/" + estado);

    } else if (servicios.length != 0 && subservicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/tiempoatencionturnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + subservicios + "/" + estado);
    }

  }

  getentradassalidasistema(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, listaCodigos: any, estado: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + listaCodigos + "/" + estado);
  }


  /** ****************************************************************************************************************** **
   ** **                                          EVALUACION                                                          ** **
   ** ****************************************************************************************************************** **/

  getResumenEvaluacion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, subservicio: any, cajero: any, opcion: string, estado: any, fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluacion/resumen/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + subservicio + "/" + cajero + "/" + opcion + "/" + estado + "/" + fecha);
  }

  getResumenEvaluacionOmitidas(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, subservicio: any, cajero: any, opcion: string, estado: any, fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluacion/omitidas/resumen/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + subservicio + "/" + cajero + "/" + opcion + "/" + estado + "/" + fecha);
  }

  getEvaluacionTurnos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, servicios: any, subservicios: any, cajeros: any, estado: any, opciones: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluacion/turnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + servicios + "/" + subservicios + "/" + cajeros + "/" + estado + "/" + opciones);
  }

  getEvaluacionOmitidaTurnos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, servicios: any, subservicios: any, cajeros: any, estado: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluacion/omitidos/turnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + servicios + "/" + subservicios + "/" + cajeros + "/" + estado);
  }

  getgraficobarras(opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarras" + "/" + opcion);
  }


  /** ****************************************************************************************************************** **
   ** **                                         DISTRIBUCION Y ESTADO DE TURNOS                                      ** **
   ** ****************************************************************************************************************** **/

  getdistribucionturnos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, servicios: any, subservicios: any, estado: any, fecha: string): Observable<servicio[]> {
    if (servicios.length == 0) {
      //return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + 0 + "/" + 0 + "/" + estado + "/" + fecha);
      return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + 0 + "/" + 0 + "/" + estado + "/" + fecha);


    } else if (subservicios.length == 0 && servicios.length != 0) {
      return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + 0 + "/" + estado + "/" + fecha);

    } else if (servicios.length != 0 && subservicios.length != 0) {
      // return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros + "/" + servicios + "/" + subservicios + "/" + estado + "/" + fecha);
      return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + servicios + "/" + subservicios + "/" + estado + "/" + fecha);
    }

  }


  /** ****************************************************************************************************************** **
   ** **                                           OPINIONES                                                          ** **
   ** ****************************************************************************************************************** **/

  getopiniones(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos);
  }

  getopinionesIC(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinionIC/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos);
  }

  getgraficoopinion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  getgraficoopinionesIC(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinionIC/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos);
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
