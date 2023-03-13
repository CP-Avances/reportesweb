"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
//////////////////////////
//TIEMPOS COMPLETOS
/////////////////////////
router.get('/tiemposcompletos/:fechaDesde/:fechaHasta/:cCajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "select usua_nombre as Usuario," +
        " serv_nombre as Servicio,  date_format(turn_fecha,  '%Y-%m-%d') as Fecha," +
        " date_format(sec_to_time(avg(IFNULL(time_to_sec(turn_tiempoespera),0))),'%H:%i:%s') as Tiempo_Espera," +
        " avg(IFNULL(time_to_sec(turn_tiempoespera),0)) as Espera," +
        " date_format(sec_to_Time(AVG(IFNULL(turn_duracionatencion,0))), '%H:%i:%s') as Tiempo_Atencion," +
        " AVG(IFNULL(turn_duracionatencion,0)) as Atencion" +
        " from turno t, servicio s, usuarios u, cajero c" +
        " where t.serv_codigo = s.serv_codigo " +
        " and t.caje_codigo = c.caje_codigo" +
        " and u.usua_codigo = c.usua_codigo" +
        " and t.TURN_FECHA >= '" + fDesde + "'" +
        " and t.TURN_FECHA <= '" + fHasta + "'" +
        " and c.caje_codigo = " + cCajero +
        " group by Servicio, Usuario, Fecha" +
        " order by Servicio, Usuario, Fecha;";
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                turnos
            });
        }
    });
});
//////////////////////////
//PROMEDIOS DE ATENCION
/////////////////////////
router.get('/promediosatencion/:fechaDesde/:fechaHasta/:cServ', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cServ = req.params.cServ;
    const query = "SELECT t.SERV_CODIGO, s.SERV_NOMBRE," +
        " date_format(sec_to_time(avg(time_to_sec(turn_tiempoespera))),'%H:%i:%s') as PromedioEspera," +
        " avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T '))) as Espera," +
        " date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') as PromedioAtencion," +
        " AVG(turn_duracionatencion) as Atencion," +
        " date_format(t.TURN_FECHA,  '%Y-%m-%d') as TURN_FECHA, (select max(turn_fecha) from turno)as fechamaxima," +
        " (select MIN(turn_fecha) from turno)as fechaminima" +
        " FROM turno t, servicio s" +
        " WHERE t.serv_codigo=s.serv_codigo" +
        " and t.turn_estado = 1" +
        " and s.empr_codigo" +
        " and t.TURN_FECHA >= '" + fDesde + "'" +
        " and t.TURN_FECHA <= '" + fHasta + "'" +
        " and s.serv_codigo = " + cServ +
        " GROUP BY t.serv_codigo, t.turn_fecha;";
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                turnos
            });
        }
    });
});
//////////////////////////
//MAXIMOS DE ATENCION
/////////////////////////
router.get('/maxatencion/:fechaDesde/:fechaHasta/:cServ', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cServ = req.params.cServ;
    const query = "SELECT  turno.SERV_CODIGO, servicio.SERV_NOMBRE," +
        " MAX(IFNULL(TURN_DURACIONATENCION,0))as duracion," +
        " concat(SEC_TO_TIME(MAX(IFNULL(TURN_DURACIONATENCION,0))))as Maximo," +
        " date_format(turno.TURN_FECHA,  '%Y-%m-%d') as Fecha," +
        " (select MAX(turn_fecha) from turno)as fechamaxima," +
        " (select MIN(turn_fecha) from turno)as fechaminima" +
        " FROM turno INNER JOIN servicio" +
        " ON turno.SERV_CODIGO = servicio.SERV_CODIGO" +
        " and turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" +
        " and servicio.serv_codigo = " + cServ +
        " group by turno.serv_codigo, turno.turn_fecha;";
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                turnos
            });
        }
    });
});
//////////////////////////
//ATENCION SERVICIO
/////////////////////////
router.get('/atencionservicio/:fechaDesde/:fechaHasta/:cCajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "select usua_nombre as Nombre, serv_nombre as Servicio," +
        " sum(turn_estado = 1) as Atendidos," +
        " sum(turn_estado = -1 or turn_estado = 2) as NoAtendidos," +
        " sum(turn_estado!=0) as total " +
        " from usuarios u, turno t, cajero c, servicio s" +
        " where u.usua_codigo = c.usua_codigo" +
        " and c.caje_codigo = t.caje_codigo" +
        " and t.serv_codigo = s.serv_codigo" +
        " AND turn_fecha >= '" + fDesde + "'" +
        " AND turn_fecha <= '" + fHasta + "'" +
        " and c.caje_codigo = " + cCajero +
        " group by Servicio, Nombre;";
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                turnos
            });
        }
    });
});
//////////////////////////
//GRAFICO SERVICIO
/////////////////////////
router.get('/graficoservicio/:fechaDesde/:fechaHasta', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "select  serv_nombre as Servicio," +
        " sum( turn_estado = 1 ) as Atendidos," +
        " sum( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos," +
        " sum( turn_estado!=0 ) as Total" +
        " from turno t, servicio s, usuarios u, cajero c" +
        " where t.serv_codigo = s.serv_codigo" +
        " and t.caje_codigo = c.caje_codigo" +
        " and u.usua_codigo = c.usua_codigo" +
        " and t.turn_fecha >= '" + fDesde + "'" +
        " and t.turn_fecha <= '" + fHasta + "'" +
        " group by  Servicio" +
        " order by Servicio;";
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                turnos
            });
        }
    });
});
//////////////////---  MENU
router.get('/promediosatencionmenu/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio1 = req.params.anio;
    let mes1 = req.params.mes;
    let dia1 = req.params.dia;
    const fecha = anio1 + '-' + mes1 + '-' + dia1;
    const query = "SELECT t.SERV_CODIGO, s.SERV_NOMBRE, date_format(sec_to_time(avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T ')))),'%H:%i:%s') as PromedioEspera, avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T '))) as Espera, date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') as PromedioAtencion, AVG(turn_duracionatencion) as Atencion, t.TURN_FECHA, (select max(turn_fecha) from turno)as fechamaxima, (select MIN(turn_fecha) from turno)as fechaminima FROM turno t, servicio s WHERE t.serv_codigo=s.serv_codigo and t.turn_estado = 1 and s.empr_codigo and t.TURN_FECHA = '" + fechas + "' and t.TURN_FECHA = '" + fechas + "' GROUP BY t.serv_codigo;";
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                turnos
            });
        }
    });
});
exports.default = router;
