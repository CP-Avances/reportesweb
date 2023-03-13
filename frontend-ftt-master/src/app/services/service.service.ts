import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
//////////////////////////////////////
import { usuario } from '../models/usuario';
import { cajero } from '../models/cajero';
import { turno } from '../models/turno';
import { servicio } from '../models/servicio';
import { evaluacion } from '../models/evaluacion';
import { empresa } from '../models/empresa';



@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  private URL = "http://192.168.0.145:3004";

  constructor(private http: HttpClient,
    private router: Router) { }


  /*   USUARIOS  */
  getturnosfecha(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha");
  }
  getfiltroturnosfechas(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfechas/" + fechaDesde + "/" + fechaHasta + "/" + cod);
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

  getturnosF(fechaDesde: any, fechaHasta: any, cod: number): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getturnos(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiempopromedioatencion");
  }





  getentradassalidasistema(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/entradasalidasistema/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getatencionusuario(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario");
  }

  getatencionusuarios(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionusuario/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }
  getfiltroturnosfecha(fecha): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/turnosfecha/" + fecha);
  }

  /* EVALUACION */
  getprmediosservicios(fechaDesde, fechaHasta, serv): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promedios/" + fechaDesde + "/" + fechaHasta + "/" + serv);
  }

  getmaxminservicios(fechaDesde, fechaHasta, serv): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimos/" + fechaDesde + "/" + fechaHasta + "/" + serv);
  }

  getprmediosempleado(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediose/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getevalomitidasempleado(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/omitidas/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }


  getmaxminempleado(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maximosminimose/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getgraficobarras(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarras");
  }

  getgraficobarrasfiltro(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficobarrasfiltro/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getgraficopastel(): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/graficopastel");
  }

  getestablecimiento(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/establecimiento/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getevalgrupo(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/evaluaciongrupos/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  /*  */

  /* ATENCION */
  gettiemposcompletos(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/tiemposcompletos/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getpromatencion(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/promediosatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getmaxatencion(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/maxatencion/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getatencionservicio(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/atencionservicio/" + fechaDesde + "/" + fechaHasta + "/" + cod);
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
  getdistribucionturnos(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturno/" + fechaDesde + "/" + fechaHasta + "/" + cod);
  }

  getdistribucionturnosresumen(fechaDesde, fechaHasta, cod): Observable<servicio[]> {
    return this.http.get<servicio[]>(this.URL + "/distestadoturnoresumen/" + fechaDesde + "/" + fechaHasta + "/" + cod);
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

}
