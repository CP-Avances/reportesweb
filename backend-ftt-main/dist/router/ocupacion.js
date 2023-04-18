"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************ **
 ** **                                      OCUPACION POR SERVICIOS                                           ** **
 ** ************************************************************************************************************ **/
router.get("/ocupacionservicios/:fechaDesde/:fechaHasta/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    const query = `
            SELECT empresa.empr_nombre AS nombreEmpresa, COUNT(turno.TURN_ESTADO) AS total,
                servicio.SERV_NOMBRE, servicio.SERV_CODIGO,
                ROUND((COUNT(turno.TURN_ESTADO)*100)/
                (SELECT SUM(c) 
                    FROM (SELECT COUNT(turn_estado) AS c 
                        FROM turno
                        WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                        AND turno.caje_codigo != 0
                        GROUP BY serv_codigo) as tl),2) AS PORCENTAJE,
                                DATE_FORMAT((SELECT MAX(turn_fecha) 
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}' AND turno.caje_codigo != 0), '%Y-%m-%d') AS fechamaxima,
                                DATE_FORMAT((SELECT MIN(turn_fecha) 
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}' AND turno.caje_codigo != 0), '%Y-%m-%d') AS fechaminima
            FROM servicio 
            INNER JOIN turno
                ON servicio.SERV_CODIGO = turno.SERV_CODIGO
            INNER JOIN empresa ON servicio.empr_codigo = empresa.empr_codigo
            WHERE turno.TURN_FECHA BETWEEN ' ${fDesde}' AND '${fHasta}'
            AND turno.caje_codigo != 0
            ${!todasSucursales ? `AND servicio.empr_codigo IN (${listaSucursales})` : ''}
            GROUP BY servicio.SERV_CODIGO;
            `;
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                turnos,
            });
        }
    });
});
/** ************************************************************************************************************ **
 ** **                                          GRAFICO OCUPACION                                             ** **
 ** ************************************************************************************************************ **/
router.get("/graficoocupacion/:fechaDesde/:fechaHasta/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    const query = `
            SELECT empresa.empr_nombre AS nombreEmpresa, COUNT(turno.TURN_ESTADO) AS total,
                servicio.SERV_NOMBRE, servicio.SERV_CODIGO,
                ROUND((COUNT(turno.TURN_ESTADO)*100) / (SELECT SUM(c) 
                    FROM (SELECT COUNT(turn_estado) as c
                        FROM turno
                        WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                        AND turno.caje_codigo != 0
                        GROUP BY serv_codigo) as tl),2)AS PORCENTAJE, 
                            (SELECT MAX(turn_fecha) 
                            FROM turno
                            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}' AND turno.caje_codigo != 0) AS fechamaxima,
                                (SELECT MIN(turn_fecha)
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}' AND turno.caje_codigo != 0) as fechaminima
            FROM servicio 
            INNER JOIN turno
                ON servicio.SERV_CODIGO = turno.SERV_CODIGO
            INNER JOIN empresa ON servicio.empr_codigo = empresa.empr_codigo
            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND turno.caje_codigo != 0
            ${!todasSucursales ? `AND servicio.empr_codigo IN (${listaSucursales})` : ''}
            GROUP BY servicio.SERV_CODIGO;
            `;
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                turnos,
            });
        }
    });
});
router.get("/graficoocupacion/:fecha", (req, res) => {
    let fechas = req.params.fecha;
    const query = `
        SELECT COUNT(turno.TURN_ESTADO) AS total, servicio.SERV_NOMBRE, servicio.SERV_CODIGO, 
            ROUND((COUNT(turno.TURN_ESTADO)*100) / (SELECT SUM(c) 
                FROM (SELECT COUNT(turn_estado) as c FROM turno GROUP BY serv_codigo) AS tl),2) AS PORCENTAJE, 
                    (SELECT MAX(turn_fecha) 
                    FROM turno 
                    WHERE turno.TURN_FECHA = '${fechas}' AND turno.TURN_FECHA = '${fechas}' ) AS fechamaxima, 
                        (SELECT MIN(turn_fecha) 
                        FROM turno 
                        WHERE turno.TURN_FECHA = '${fechas}' AND turno.TURN_FECHA = '${fechas}' ) AS fechaminima 
        FROM servicio 
        INNER JOIN turno 
            ON servicio.SERV_CODIGO = turno.SERV_CODIGO 
        WHERE turno.TURN_FECHA = '${fechas}' 
            AND turno.TURN_FECHA = '${fechas}' 
            AND servicio.empr_codigo 
            AND servicio.serv_codigo  
        GROUP BY servicio.SERV_CODIGO;
        `;
    mysql_1.default.ejecutarQuery(query, (err, turnos) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                turnos,
            });
        }
    });
});
exports.default = router;
