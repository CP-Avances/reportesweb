"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
//////////////////////////
//OCUPACION POR SERVICIOS
/////////////////////////
router.get('/ocupacionservicios/:fechaDesde/:fechaHasta', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "SELECT cajero.caje_nombre as Usuario, count(turno.TURN_ESTADO) as total," +
        " servicio.SERV_NOMBRE, servicio.SERV_CODIGO," +
        " ROUND((count(turno.TURN_ESTADO)*100)/" +
        " (select sum(c) from " +
        " (select count(turn_estado) as c from turno" +
        " where" +
        " turno.turn_fecha >= '" + fDesde + "'" +
        " and turno.turn_fecha <= '" + fHasta + "'" +
        " group by serv_codigo) as tl),2)AS PORCENTAJE," +
        " date_format((select MAX(turn_fecha) from turno" +
        " WHERE turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" + "),  '%Y-%m-%d') as fechamaxima," +
        " date_format((select MIN(turn_fecha) from turno" +
        " WHERE turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" + "),  '%Y-%m-%d') as fechaminima" +
        " FROM cajero, servicio INNER JOIN turno" +
        " ON servicio.SERV_CODIGO = turno.SERV_CODIGO" +
        " WHERE" +
        " cajero.caje_codigo = turno.caje_codigo " +
        " and turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" +
        " and servicio.empr_codigo" +
        " and servicio.serv_codigo" +
        " group by servicio.SERV_CODIGO,cajero.caje_nombre;";
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
//GRAFICO OCUPACION 
/////////////////////////
router.get('/graficoocupacion/:fechaDesde/:fechaHasta', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "SELECT count(turno.TURN_ESTADO) as total," +
        " servicio.SERV_NOMBRE," +
        " servicio.SERV_CODIGO," +
        " ROUND((count(turno.TURN_ESTADO)*100)/" +
        " (select sum(c) from (select count(turn_estado) as c" +
        " from turno" +
        " where" +
        " turno.turn_fecha >= '" + fDesde + "'" +
        " and turno.turn_fecha <= '" + fHasta + "'" +
        " group by serv_codigo) as tl),2)AS PORCENTAJE," +
        " (select MAX(turn_fecha) from turno" +
        " WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" + ")as fechamaxima," +
        " (select MIN(turn_fecha)" +
        " from turno" +
        " WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" + ")as fechaminima" +
        " FROM servicio INNER JOIN turno" +
        " ON servicio.SERV_CODIGO = turno.SERV_CODIGO" +
        " WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" +
        " and servicio.empr_codigo" +
        " and servicio.serv_codigo  group by servicio.SERV_CODIGO;";
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
router.get('/graficoocupacion/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio1 = req.params.anio;
    let mes1 = req.params.mes;
    let dia1 = req.params.dia;
    const fecha = anio1 + '-' + mes1 + '-' + dia1;
    const query = "SELECT count(turno.TURN_ESTADO) as total, servicio.SERV_NOMBRE, servicio.SERV_CODIGO, ROUND((count(turno.TURN_ESTADO)*100)/(select sum(c) from (select count(turn_estado) as c from turno group by serv_codigo) as tl),2)AS PORCENTAJE, (select MAX(turn_fecha) from turno WHERE turno.TURN_FECHA = '" + fechas + "' and turno.TURN_FECHA = '" + fechas + "' )as fechamaxima, (select MIN(turn_fecha) from turno WHERE turno.TURN_FECHA = '" + fechas + "'  and turno.TURN_FECHA = '" + fechas + "' )as fechaminima FROM servicio INNER JOIN turno ON servicio.SERV_CODIGO = turno.SERV_CODIGO WHERE turno.TURN_FECHA = '" + fechas + "'  and turno.TURN_FECHA = '" + fechas + "'  and servicio.empr_codigo and servicio.serv_codigo  group by servicio.SERV_CODIGO";
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
