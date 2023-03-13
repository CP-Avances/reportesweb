"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************ **
 ** **                                      INGRESO DE CLIENTES                                               ** **
 ** ************************************************************************************************************ **/
router.get('/ingresoclientes/:fechaDesde/:fechaHasta/:empresa', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
        query =
            `
            SELECT e.empr_nombre AS nombreEmpresa, date_format(turn_fecha, '%Y-%m-%d') AS Fecha, 
            COUNT(turn_codigo) AS clientes,
            (SELECT MAX(turn_fecha) FROM turno
                WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno
                WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
            FROM turno turno, servicio s, empresa e
            WHERE turno.serv_codigo=s.serv_codigo
                AND s.empr_codigo = e.empr_codigo 
                AND turno.TURN_FECHA BETWEEN ' ${fDesde}' AND '${fHasta}'
            GROUP BY turn_fecha, nombreEmpresa;
            `;
    }
    else {
        query =
            `
            SELECT date_format(turn_fecha, '%Y-%m-%d') as Fecha, count(turn_codigo) AS clientes,
            (SELECT MAX(turn_fecha) FROM turno
                WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno
                WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
            FROM turno turno, servicio s
            WHERE turno.serv_codigo = s.serv_codigo 
            AND turno.TURN_FECHA BETWEEN ' ${fDesde}' AND '${fHasta}'
            AND s.empr_codigo = ${cEmpresa}
            GROUP BY turn_fecha;
            `;
    }
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
    const query = `
        SELECT turn_fecha, count(turn_codigo) AS clientes, (SELECT MAX(turn_fecha) FROM turno) AS fechamaxima, 
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima 
        FROM turno turno, servicio s 
        WHERE turno.serv_codigo = s.serv_codigo
        AND turno.TURN_FECHA = ${fechas} 
        GROUP BY turn_fecha;
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
