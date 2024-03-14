import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { servicio } from '../models/servicio';
import { empresa } from '../models/empresa';
import { cajero } from '../models/cajero';

@Injectable({
  providedIn: 'root'
})

export class ServiceService {

  private URL = "";
  private token: String;
  private headers: HttpHeaders;

  constructor(
    private http: HttpClient
  ) {
      this.actualizarCabecera();
    }

  leerToken() {
    if (localStorage.getItem('token')) {
      return localStorage.getItem('token')
    } else {
      return '';
    }
  }

  leerHost() {
    if (localStorage.getItem('host')) {
      return localStorage.getItem('host');
    } else {
      return '';
    }
  }

  actualizarCabecera() {
    this.URL = this.leerHost();
    this.token = this.leerToken();
    this.headers = new HttpHeaders({
      'Authorization': 'Bearer ' + this.token
    });
  }

  /** ****************************************************************************************************************** **
   ** **                                        TURNOS POR FECHAS                                                     ** **
   ** ****************************************************************************************************************** **/

  getfiltroturnosfechas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                        TURNOS TOTALES POR FECHAS                                             ** **
   ** ****************************************************************************************************************** **/

  getturnostotalfechas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                         TURNOS META                                                          ** **
   ** ****************************************************************************************************************** **/

  getturnosMeta(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros, { headers: this.headers });
  }

  setMeta(valor: number) {
    return this.http.get<any>(`${this.URL}/setMeta/${valor}`, { headers: this.headers });
  }

  getMeta(): Observable<any> {
    return this.http.get<any>(this.URL + "/getMeta", { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                               USUARIOS                                                       ** **
   ** ****************************************************************************************************************** **/

  getturnosfecha(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha", { headers: this.headers });
  }

  getAllSucursales(): Observable<empresa[]> {
    console.log(this.URL + "/getallsucursales")
    return this.http.get<empresa[]>(this.URL + "/getallsucursales", { headers: this.headers });
  }

  getAllCategorias(tipo: any): Observable<any> {
    return this.http.get<any>(this.URL + "/categorias/" + tipo, { headers: this.headers });
  }

  getAllCajeros(): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros", { headers: this.headers });
  }

  getAllCajerosS(sucursales: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + sucursales, { headers: this.headers });
  }

  getAllServicios(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios", { headers: this.headers });
  }

  getAllServiciosS(sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios" + "/" + sucursales, { headers: this.headers });
  }


  /** ************************************************************************************************************ **
   ** **                                    TIEMPO PROMEDIO DE ATENCION                                         ** **
   ** ************************************************************************************************************ **/

  getturnosF(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getturnosAtencion(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempoatencionturnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getentradassalidasistema(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }

  getatencionusuario(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario");
  }

  getatencionusuarios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }
  getfiltroturnosfecha(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha/" + fecha);
  }


  /** ****************************************************************************************************************** **
   ** **                                          EVALUACION                                                          ** **
   ** ****************************************************************************************************************** **/

  getprmediosservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedios/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }

  getmaxminservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }

  getprmediosempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediose/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }

  getevalomitidasempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/omitidas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getmaxminempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimose/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }

  getgraficobarras(opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarras" + "/" + opcion, { headers: this.headers });
  }

  getgraficobarrasfiltro(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarrasfiltro/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }

  getgraficopastel(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficopastel", { headers: this.headers });
  }

  getestablecimiento(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/establecimiento/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }

  getevalgrupo(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluaciongrupos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales + "/" + opcion, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                            ATENCION                                                          ** **
   ** ****************************************************************************************************************** **/

  gettiemposcompletos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiemposcompletos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getclientes(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/cliente/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getpromatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales, { headers: this.headers });
  }

  gettiempoatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempoatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales, { headers: this.headers });
  }

  getmaxatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maxatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales, { headers: this.headers });
  }

  getatencionservicio(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionservicio/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getatenciongrafico(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoservicio/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                           OCUPACION                                                          ** **
   ** ****************************************************************************************************************** **/

  getocupacionservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ocupacionservicios/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }

  getgraficoocupacion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                         DISTRIBUCION Y ESTADO DE TURNOS                                      ** **
   ** ****************************************************************************************************************** **/

  getdistribucionturnos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }

  getdistribucionturnosresumen(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturnoresumen/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                           INGRESO DE CLIENTES                                                ** **
   ** ****************************************************************************************************************** **/

  getingresoclientes(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientes/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                          ATENDIDOS MULTIPLES                                                 ** **
   ** ****************************************************************************************************************** **/

  getatendidosmultiples(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atendidosmultiples/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                           OPINIONES                                                          ** **
   ** ****************************************************************************************************************** **/

  getopiniones(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos, { headers: this.headers });
  }

  getopinionesIC(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any, categorias: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinionIC/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos + "/" + categorias, { headers: this.headers });
  }

  getgraficoopinion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales, { headers: this.headers });
  }

  getgraficoopinionesIC(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any, tipos: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinionIC/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + tipos, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                           GRAFICOS MENU                                                      ** **
   ** ****************************************************************************************************************** **/

  getatencionusuariomenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fecha, { headers: this.headers });
  }

  getpromediosatencionmenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencionmenu/" + fecha, { headers: this.headers });
  }

  getingresoclientesmenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientesmenu/" + fecha, { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                         GRAFICOS EXTRA MENU                                                  ** **
   ** ****************************************************************************************************************** **/

  gettotaltickets(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totaltickets/" + fecha, { headers: this.headers });
  }

  gettotalatendidos(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totalatendidos/" + fecha, { headers: this.headers });
  }

  gettotalsinatender(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totalsinatender/" + fecha, { headers: this.headers });
  }

  getpromedioatencion(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedioatencion/" + fecha, { headers: this.headers });
  }

  getgrafeva(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evagraf", { headers: this.headers });
  }

  getserviciossolicitados(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/servsoli", { headers: this.headers });
  }

  getOpcionesEvaluacion(): Observable<any> {
    return this.http.get<any>(this.URL + "/opcionesEvaluacion", { headers: this.headers });
  }

  getIdentificacionCliente(): Observable<any> {
    return this.http.get<any>(this.URL + "/identificacionCliente", { headers: this.headers });
  }

  getturnos(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion", { headers: this.headers });
  }

  setImagen(formdata: any) {
    return this.http.post<any>(`${this.URL}/uploadImage`, formdata, { headers: this.headers });
  }

  getImagen(): Observable<any> {
    return this.http.get<any>(this.URL + "/nombreImagen", { headers: this.headers });
  }


  /** ****************************************************************************************************************** **
   ** **                                         MARCA DE AGUA REPORTES                                               ** **
   ** ****************************************************************************************************************** **/

  setMarca(marca: string) {
    return this.http.get<any>(`${this.URL}/setMarca/${marca}`, { headers: this.headers });
  }

  getMarca(): Observable<any> {
    return this.http.get<any>(this.URL + "/getMarca", { headers: this.headers });
  }

}
