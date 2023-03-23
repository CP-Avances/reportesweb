"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************* **
 ** **                                    DISTRIBUCION Y ESTADO DE TURNOS                                      ** **
 ** ************************************************************************************************************* **/
router.get('/distestadoturno/:fechaDesde/:fechaHasta/:cCajero/:sucursal', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const cSucursal = req.params.sucursal;
    const query = `
        SELECT e.empr_nombre AS nombreEmpresa, c.caje_nombre AS Usuario, COUNT(t.turn_codigo) AS turnos,
            s.SERV_NOMBRE, date_format(t.TURN_FECHA, '%Y-%m-%d') AS fecha,
            SUM(t.TURN_ESTADO = 1) AS ATENDIDOS,
            SUM(t.TURN_ESTADO = 0 OR t.TURN_ESTADO = 2 OR t.TURN_ESTADO = -1) AS NOATENDIDOS,
            (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
        FROM servicio s, turno t, cajero c, empresa e, usuarios u
        WHERE s.serv_codigo = t.serv_codigo AND c.caje_codigo = t.caje_codigo
            AND s.empr_codigo = e.empr_codigo
            AND c.usua_codigo = u.usua_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            ${cCajero == "-2" ? "" : `AND c.caje_codigo = ${cCajero}`}
            ${cSucursal != "-1" ? `AND u.empr_codigo = ${cSucursal}` : ""}
        GROUP BY t.serv_codigo, t.turn_fecha
        ORDER BY t.turn_fecha;
        `;
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
/** ***************************************************************************************************************** **
 ** **                                    DISTRIBUCION Y ESTADO DE TURNOS RESUMEN                                  ** **
 ** ***************************************************************************************************************** **/
router.get('/distestadoturnoresumen/:fechaDesde/:fechaHasta/:cCajero/:sucursal', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const cSucursal = req.params.sucursal;
    const query = `
        SELECT e.empr_nombre AS nombreEmpresa, c.caje_nombre AS Usuario, COUNT(t.turn_codigo) AS turnos,
        s.SERV_NOMBRE,
        SUM(t.TURN_ESTADO = 1) AS ATENDIDOS,
        SUM(t.TURN_ESTADO = 0 OR t.TURN_ESTADO = 2 OR t.TURN_ESTADO = -1) AS NOATENDIDOS,
        (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
        (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
        FROM servicio s, turno t, cajero c, empresa e, usuarios u
        WHERE s.serv_codigo = t.serv_codigo  
            AND c.caje_codigo = t.caje_codigo 
            AND s.empr_codigo = e.empr_codigo
            AND c.usua_codigo = u.usua_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            ${cCajero == "-2" ? "" : `AND c.caje_codigo = ${cCajero}`}
            ${cSucursal != "-1" ? `AND u.empr_codigo = ${cSucursal}` : ""}
        GROUP BY t.serv_codigo, t.turn_fecha
        ORDER BY t.turn_fecha;
        `;
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
