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

  private URL = "http://192.168.0.9:3004";

  constructor(
    private http: HttpClient
  ) { }

  /** ****************************************************************************************************************** **
   ** **                                        TRUNOS POR FECHAS                                                     ** **
   ** ****************************************************************************************************************** **/

  getfiltroturnosfechas(fechaDesde: any, fechaHasta: any, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }


  /*   USUARIOS  */
  getturnosfecha(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha");
  }


  getAllSucursales(): Observable<empresa[]> {
    return this.http.get<empresa[]>(this.URL + "/getallsucursales");
  }

  getAllCajeros(): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros");
  }

  getAllCajerosS(cod: string): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + cod);
  }


  getAllServicios(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios");
  }

  getAllServiciosS(cod: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios" + "/" + cod);
  }



  /** ************************************************************************************************************ **
   ** **                                    TIEMPO PROMEDIO DE ATENCION                                         ** ** 
   ** ************************************************************************************************************ **/

  getturnosF(fechaDesde: any, fechaHasta: any, listaCodigos: any, codSucursal: string | string[]): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getentradassalidasistema(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  getatencionusuario(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario");
  }

  getatencionusuarios(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }
  getfiltroturnosfecha(fecha: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha/" + fecha);
  }

  /* EVALUACION */
  getprmediosservicios(fechaDesde: string, fechaHasta: string, serv: string | number, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedios/" + fechaDesde + "/" + fechaHasta + "/" + serv + "/" + opcion);
  }

  getmaxminservicios(fechaDesde: string, fechaHasta: string, serv: string | number, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimos/" + fechaDesde + "/" + fechaHasta + "/" + serv + "/" + opcion);
  }

  getprmediosempleado(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number,opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediose/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/"+ codSucursal+ "/" + opcion);
  }

  getevalomitidasempleado(fechaDesde: string, fechaHasta: string, listaCodigos:any, codSucursal: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/omitidas/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }


  getmaxminempleado(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number,opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimose/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal + "/" + opcion);
  }

  getgraficobarras(opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarras" + "/" + opcion);
  }

  getgraficobarrasfiltro(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarrasfiltro/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal + "/" + opcion);
  }

  getgraficopastel(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficopastel");
  }

  getestablecimiento(fechaDesde: string, fechaHasta: string, sucursales: any, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/establecimiento/" + fechaDesde + "/" + fechaHasta + "/" + sucursales + "/" + opcion);
  }

  getevalgrupo(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number, opcion: string): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluaciongrupos/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal + "/" + opcion);
  }

  /*  */

  /* ATENCION */
  gettiemposcompletos(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiemposcompletos/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getpromatencion(fechaDesde: string, fechaHasta: string, cod: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getmaxatencion(fechaDesde: string, fechaHasta: string, cod: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maxatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getatencionservicio(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionservicio/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getatenciongrafico(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoservicio/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  /* OCUPACION */
  getocupacionservicios(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ocupacionservicios/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  getgraficoocupacion(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  /* DISTRIBUCION Y ESTADO DE TURNOS */
  getdistribucionturnos(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getdistribucionturnosresumen(fechaDesde: string, fechaHasta: string, listaCodigos: any, codSucursal: string | number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturnoresumen/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  /*INGRESO DE CLIENTES  */
  getingresoclientes(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientes/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  /* ATENDIDOS MULTIPLES */
  getatendidosmultiples(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atendidosmultiples/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  /* OPINIONES */
  getopiniones(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinion/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
  }

  getgraficoopinion(fechaDesde: string, fechaHasta: string, sucursales: any): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinion/" + fechaDesde + "/" + fechaHasta + "/" + sucursales);
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

}
