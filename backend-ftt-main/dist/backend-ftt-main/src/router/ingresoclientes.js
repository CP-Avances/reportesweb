"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
///////////////////
//INGRESO DE CLIENTES
//////////////////
router.get('/ingresoclientes/:fechaDesde/:fechaHasta', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "SELECT date_format(turn_fecha,  '%Y-%m-%d') as Fecha, count(turn_codigo) as clientes," +
        " (select MAX(turn_fecha) from turno" +
        " where" +
        " turno.turn_fecha >= '" + fDesde + "'" +
        " and turno.turn_fecha <= '" + fHasta + "'" + ")as fechamaxima," +
        " (select MIN(turn_fecha) from turno" +
        " where" +
        " turno.turn_fecha >= '" + fDesde + "'" +
        " and turno.turn_fecha <= '" + fHasta + "'" + ")as fechaminima" +
        " FROM turno turno, servicio s" +
        " WHERE turno.serv_codigo=s.serv_codigo AND" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " and turno.TURN_FECHA <= '" + fHasta + "'" +
        " GROUP BY turn_fecha;";
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
router.get('/ingresoclientesmenu/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio1 = req.params.anio;
    let mes1 = req.params.mes;
    let dia1 = req.params.dia;
    const fecha = anio1 + '-' + mes1 + '-' + dia1;
    const query = "SELECT turn_fecha, count(turn_codigo) as clientes, (select MAX(turn_fecha) from turno)as fechamaxima, (select MIN(turn_fecha) from turno)as fechaminima FROM turno turno, servicio s WHERE turno.serv_codigo=s.serv_codigo AND s.empr_codigo AND turno.TURN_FECHA = '" + fechas + "' AND turno.TURN_FECHA = '" + fechas + "' and turno.turn_hora and turno.turn_hora and s.serv_codigo GROUP BY turn_fecha;";
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
