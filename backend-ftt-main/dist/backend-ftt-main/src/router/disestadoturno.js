"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
///////////////////
//Distribucion y estado de turnos
//////////////////
router.get('/distestadoturno/:fechaDesde/:fechaHasta/:cCajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT c.caje_nombre as Usuario, count(t.turn_codigo)as turnos," +
        " s.SERV_NOMBRE, date_format(t.TURN_FECHA,  '%Y-%m-%d') as fecha," +
        " SUM(t.TURN_ESTADO=1)AS ATENDIDOS," +
        " SUM(t.TURN_ESTADO=0 or t.TURN_ESTADO=2 or t.TURN_ESTADO=-1)AS NOATENDIDOS," +
        " (select MAX(turn_fecha) from turno WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " AND turno.TURN_FECHA <= '" + fHasta + "'" + ")as fechamaxima," +
        " (select MIN(turn_fecha) from turno WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " AND turno.TURN_FECHA <= '" + fHasta + "'" + ") as fechaminima" +
        " FROM servicio s, turno t, cajero c" +
        " WHERE s.serv_codigo = t.serv_codigo  and c.caje_codigo = t.caje_codigo " +
        " AND t.TURN_FECHA >= '" + fDesde + "'" +
        " AND t.TURN_FECHA <= '" + fHasta + "'" +
        " and c.caje_codigo = " + cCajero +
        " group by  t.serv_codigo, t.turn_fecha" +
        " order by t.turn_fecha;";
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
///////////////////
//Distribucion y estado de turnos RESUMEN
//////////////////
router.get('/distestadoturnoresumen/:fechaDesde/:fechaHasta/:cCajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT c.caje_nombre as Usuario, count(t.turn_codigo)as turnos," +
        " s.SERV_NOMBRE," +
        " SUM(t.TURN_ESTADO=1)AS ATENDIDOS," +
        " SUM(t.TURN_ESTADO=0 or t.TURN_ESTADO=2 or t.TURN_ESTADO=-1)AS NOATENDIDOS," +
        " (select MAX(turn_fecha) from turno WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " AND turno.TURN_FECHA <= '" + fHasta + "'" + ")as fechamaxima," +
        " (select MIN(turn_fecha) from turno WHERE" +
        " turno.TURN_FECHA >= '" + fDesde + "'" +
        " AND turno.TURN_FECHA <= '" + fHasta + "'" + ") as fechaminima" +
        " FROM servicio s, turno t, cajero c" +
        " WHERE s.serv_codigo = t.serv_codigo  and c.caje_codigo = t.caje_codigo " +
        " AND t.TURN_FECHA >= '" + fDesde + "'" +
        " AND t.TURN_FECHA <= '" + fHasta + "'" +
        " and c.caje_codigo = " + cCajero +
        " group by  t.serv_codigo" +
        " order by t.turn_fecha;";
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
