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

  getfiltroturnosfechas(fechaDesde: any, fechaHasta: any, cod: number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + cod);
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

  getAllCajerosS(cod): Observable<cajero[]> {
    return this.http.get<cajero[]>(this.URL + "/getallcajeros/" + cod);
  }


  getAllServicios(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios");
  }

  getAllServiciosS(cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/getallservicios" + "/" + cod);
  }



  /** ************************************************************************************************************ **
   ** **                                    TIEMPO PROMEDIO DE ATENCION                                         ** ** 
   ** ************************************************************************************************************ **/

  getturnosF(fechaDesde: any, fechaHasta: any, listaCodigos: any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getentradassalidasistema(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getatencionusuario(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario");
  }

  getatencionusuarios(fechaDesde, fechaHasta, listaCodigos: any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }
  getfiltroturnosfecha(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha/" + fecha);
  }

  /* EVALUACION */
  getprmediosservicios(fechaDesde, fechaHasta, serv, opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedios/" + fechaDesde + "/" + fechaHasta + "/" + serv + "/" + opcion);
  }

  getmaxminservicios(fechaDesde, fechaHasta, serv, opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimos/" + fechaDesde + "/" + fechaHasta + "/" + serv + "/" + opcion);
  }

  getprmediosempleado(fechaDesde, fechaHasta, listaCodigos: any, codSucursal,opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediose/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/"+ codSucursal+ "/" + opcion);
  }

  getevalomitidasempleado(fechaDesde, fechaHasta, listaCodigos:any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/omitidas/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }


  getmaxminempleado(fechaDesde, fechaHasta, listaCodigos: any, codSucursal,opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimose/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal + "/" + opcion);
  }

  getgraficobarras(opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarras" + "/" + opcion);
  }

  getgraficobarrasfiltro(fechaDesde, fechaHasta, listaCodigos: any, codSucursal, opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarrasfiltro/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal + "/" + opcion);
  }

  getgraficopastel(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficopastel");
  }

  getestablecimiento(fechaDesde, fechaHasta, cod, opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/establecimiento/" + fechaDesde + "/" + fechaHasta + "/" + cod + "/" + opcion);
  }

  getevalgrupo(fechaDesde, fechaHasta, listaCodigos: any, codSucursal, opcion): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluaciongrupos/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal + "/" + opcion);
  }

  /*  */

  /* ATENCION */
  gettiemposcompletos(fechaDesde, fechaHasta, listaCodigos: any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiemposcompletos/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getpromatencion(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getmaxatencion(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maxatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getatencionservicio(fechaDesde, fechaHasta, listaCodigos: any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionservicio/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getatenciongrafico(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoservicio/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  /* OCUPACION */
  getocupacionservicios(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ocupacionservicios/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getgraficoocupacion(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  /* DISTRIBUCION Y ESTADO DE TURNOS */
  getdistribucionturnos(fechaDesde, fechaHasta, listaCodigos: any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  getdistribucionturnosresumen(fechaDesde, fechaHasta, listaCodigos: any, codSucursal): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturnoresumen/" + fechaDesde + "/" + fechaHasta + "/" + listaCodigos + "/" + codSucursal);
  }

  /*INGRESO DE CLIENTES  */
  getingresoclientes(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientes/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  /* ATENDIDOS MULTIPLES */
  getatendidosmultiples(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atendidosmultiples/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  /* OPINIONES */
  getopiniones(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/opinion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getgraficoopinion(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoopinion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  /* graficos menu */
  getatencionusuariomenu(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficoocupacion/" + fecha);
  }

  getpromediosatencionmenu(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencionmenu/" + fecha);
  }

  getingresoclientesmenu(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/ingresoclientesmenu/" + fecha);
  }

  /////////////////////////////////
  //GRAFICOS EXTRA MENU
  ////////////////////////////////
  gettotaltickets(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totaltickets/" + fecha);
  }
  gettotalatendidos(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totalatendidos/" + fecha);
  }
  gettotalsinatender(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/totalsinatender/" + fecha);
  }
  getpromedioatencion(fecha): Observable<servicio[]> {
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
