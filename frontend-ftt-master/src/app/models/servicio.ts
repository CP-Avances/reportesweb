export class servicio {
  serv_codigo: number;
  empr_codigo: number;
  serv_nombre: string;
  serv_descripcion: string;
  serv_estado: number;
  serv_tiempoatencion: number;
  turn_estado: number;
  turn_fecha: Date;
  turn_hora: number;
  turn_minuto: number;
  // VARIABLES DEL REPORTE TURNO PROMEDIO DE ATENCION
  contador: number;
  promedio: string;
  atendidos: number;
  noatendidos: number;
  total: number;
  Nombre: string;
  Usuario: string;
}
