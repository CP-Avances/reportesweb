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


  private URL = "http://192.168.0.6:3004";

  constructor(
    private http: HttpClient
  ) { }

  /** ****************************************************************************************************************** **
   ** **                                        TRUNOS POR FECHAS                                                     ** **
   ** ****************************************************************************************************************** **/

  getfiltroturnosfechas(fechaDesde: any, fechaHasta: any, horaInicio: any, horaFin: any, sucursales: any, cajeros: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/"+ horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros);
  }

  /** ****************************************************************************************************************** **
   ** **                                        TRUNOS TOTALES POR FECHAS                                             ** **
   ** ****************************************************************************************************************** **/

  getturnostotalfechas(fechaDesde: any, fechaHasta: any,  horaInicio: any, horaFin: any, sucursales: any, cajeros: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnostotalfechas/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/"  + sucursales + "/" + cajeros);
  }
  
  /** ****************************************************************************************************************** **
   ** **                                         TRUNOS META                                                          ** **
   ** ****************************************************************************************************************** **/

  getturnosMeta(fechaDesde: any, fechaHasta: any,  horaInicio: any, horaFin: any, sucursales: any, cajeros: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosmeta/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales + "/" + cajeros);
  }

  /*   USUARIOS  */
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

  getAllCajerosS(sucursales: any): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + sucursales);
  }


  getAllServicios(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios");
  }

  getAllServiciosS(sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios" + "/" + sucursales);
  }



  /** ************************************************************************************************************ **
   ** **                                    TIEMPO PROMEDIO DE ATENCION                                         ** ** 
   ** ************************************************************************************************************ **/

  getturnosF(fechaDesde: any, fechaHasta: any,  horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/"  + listaCodigos + "/" + sucursales);
  }

  getturnosAtencion(fechaDesde: any, fechaHasta: any,  horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempoatencionturnos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getentradassalidasistema(fechaDesde: string, fechaHasta: string,  horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  getatencionusuario(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario");
  }

  getatencionusuarios(fechaDesde: string, fechaHasta: string,  horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }
  getfiltroturnosfecha(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha/" + fecha);
  }

  /* EVALUACION */
  getprmediosservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any , opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedios/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + opcion);
  }

  getmaxminservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales + "/" + opcion);
  }

  getprmediosempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediose/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/"+ sucursales+ "/" + opcion);
  }

  getevalomitidasempleado(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos:any, sucursales: any): Observable<servicio[]> {
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

  /*  */

  /* ATENCION */
  gettiemposcompletos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiemposcompletos/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getpromatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any ): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + servicios + "/" + sucursales);
  }

  gettiempoatencion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, servicios: any, sucursales: any ): Observable<servicio[]> {
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

  /* OCUPACION */
  getocupacionservicios(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ocupacionservicios/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  getgraficoocupacion(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  /* DISTRIBUCION Y ESTADO DE TURNOS */
  getdistribucionturnos(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  getdistribucionturnosresumen(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, listaCodigos: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturnoresumen/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + listaCodigos + "/" + sucursales);
  }

  /*INGRESO DE CLIENTES  */
  getingresoclientes(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientes/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  /* ATENDIDOS MULTIPLES */
  getatendidosmultiples(fechaDesde: string, fechaHasta: string, horaInicio: any, horaFin: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atendidosmultiples/" + fechaDesde + "/" + fechaHasta + "/" + horaInicio + "/" + horaFin + "/" + sucursales);
  }

  /* OPINIONES */
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
  /* graficos menu */
  getatencionusuariomenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fecha);
  }

  getpromediosatencionmenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencionmenu/" + fecha);
  }

  getingresoclientesmenu(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientesmenu/" + fecha);
  }

  /////////////////////////////////
  //GRAFICOS EXTRA MENU
  ////////////////////////////////
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

  /////////////////////////////
  getgrafeva(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evagraf");
  }

  getserviciossolicitados(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/servsoli");
  }

  getOpcionesEvaluacion(): Observable<any> {
    return this.http.get<any>(this.URL + "/opcionesEvaluacion");
  }

  getturnos(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion");
  }

  setImagen(formdata: any){
    return this.http.post<any>(`${this.URL}/uploadImage`,formdata);
  }

  getImagen(): Observable<any> {
    return this.http.get<any>(this.URL + "/nombreImagen");
  }

  //Meta de turnos
  setMeta(valor: number){
    return this.http.get<any>(`${this.URL}/setMeta/${valor}`);
  }

  getMeta(): Observable<any> {
    return this.http.get<any>(this.URL + "/getMeta");
  }

  //Marca de agua
  setMarca(marca: string){
    return this.http.get<any>(`${this.URL}/setMarca/${marca}`);
  }

  getMarca(): Observable<any> {
    return this.http.get<any>(this.URL + "/getMarca");
  }

}
