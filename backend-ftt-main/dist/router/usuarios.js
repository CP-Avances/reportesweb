"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************ **
 ** **                                      TURNOS POR FECHA                                                  ** **
 ** ************************************************************************************************************ **/
router.get('/turnosfecha', (req, res) => {
    const query = `
        SELECT usua_nombre as Usuario, serv_nombre as Servicio,
            date_format(turn_fecha, "%Y-%m-%d") as Fecha, SUM(turn_estado = 1) AS Atendidos,
            SUM( turn_estado = 2 OR turn_estado = -1 ) AS No_Atendidos,
            COUNT( turn_estado ) AS Total
        FROM turno t, servicio s, usuarios u, cajero c
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo 
        GROUP BY Fecha, Usuario, Servicio
        ORDER BY Usuario, Fecha, Servicio;
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
router.get('/getallsucursales', (req, res) => {
    const query = `
        SELECT * FROM empresa ORDER BY empr_nombre;
        `;
    mysql_1.default.ejecutarQuery(query, (err, empresas) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
            console.log(err);
        }
        else {
            res.json({
                ok: true,
                empresas
            });
        }
    });
});
router.get('/getallcajeros', (req, res) => {
    const query = `
        SELECT * FROM cajero usua_codigo != 2 ORDER BY caje_nombre;
        `;
    mysql_1.default.ejecutarQuery(query, (err, cajeros) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                cajeros
            });
        }
    });
});
router.get('/getallcajeros/:empresa', (req, res) => {
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
        query =
            `
            SELECT c.caje_codigo, c.usua_codigo, c.caje_apellido, c.caje_nombre, c.caje_estado 
            FROM cajero c, usuarios u 
            WHERE u.usua_codigo = c.usua_codigo
            AND u.usua_codigo != 2;
            `;
    }
    else {
        query =
            `
            SELECT c.caje_codigo, c.usua_codigo, c.caje_apellido, c.caje_nombre, c.caje_estado 
            FROM cajero c, usuarios u 
            WHERE u.usua_codigo = c.usua_codigo AND u.empr_codigo = ${cEmpresa}
            AND u.usua_codigo != 2;
            `;
    }
    mysql_1.default.ejecutarQuery(query, (err, cajeros) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
            console.log(err);
        }
        else {
            res.json({
                ok: true,
                cajeros
            });
        }
    });
});
/** ************************************************************************************************************ **
 ** **                               TIEMPO PROMEDIO DE ATENCION                                              ** **
 ** ************************************************************************************************************ **/
router.get('/tiempopromedioatencion/:fechaDesde/:fechaHasta/:cajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cajero;
    const query = `
        SELECT e.empr_nombre AS nombreEmpresa, serv_nombre AS Servicio, caje_nombre AS Nombre, 
            COUNT(turn_codigo) AS Turnos, 
            sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))) AS Promedio 
        FROM cajero c, turno t, servicio s, empresa e 
        WHERE t.caje_codigo = c.caje_codigo 
            AND t.serv_codigo = s.serv_codigo 
            AND s.empr_codigo = e.empr_codigo  
            AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
            AND c.caje_codigo = ${cCajero} 
        GROUP BY nombreEmpresa, Nombre, Servicio
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
router.get('/tiempopromedioatencion', (req, res) => {
    const query = `
        SELECT serv_nombre AS Servicio, caje_nombre as Nombre,
            COUNT(turn_codigo) AS Turnos, 
            date_format(sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))), '%H:%i:%s') AS Promedio 
        FROM cajero c, turno t, servicio s 
        WHERE t.caje_codigo = c.caje_codigo 
        AND t.serv_codigo = s.serv_codigo
        GROUP BY Nombre, Servicio
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
/** ************************************************************************************************************ **
 ** **                               ENTRADAS Y SALIDAD DEL SISTEMA                                           ** **
 ** ************************************************************************************************************ **/
router.get('/entradasalidasistema/:fechaDesde/:fechaHasta/:empresa', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == '-1') {
        query =
            `
            SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario,
            CAST(STR_TO_DATE(concat(reg_fecha," ",reg_hora,":",reg_minuto,":00"),'%Y-%m-%d %H:%i:%s') AS CHAR) AS fecha,
                reg_hora as Hora, reg_minuto as Minuto,
                IF(reg_estado = 1, 'Entrada Servicio',
                IF(reg_estado = 2, 'Salida Servicio', 
                IF( reg_estado = 3, 'Entrada Emisión', 'Salida Emisión'))) AS Razon
            FROM registro r, usuarios u, empresa e 
            WHERE r.usua_codigo = u.usua_codigo
            AND u.empr_codigo = e.empr_codigo
            AND reg_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            AND u.usua_codigo != 2
            ORDER BY reg_fecha desc, fecha;
            `;
    }
    else {
        query =
            `
            SELECT usua_nombre as Usuario,
            STR_TO_DATE(concat(reg_fecha," ",reg_hora,":",reg_minuto,":00"),'%Y-%m-%d %H:%i:%s') AS fecha,
                reg_hora AS Hora, reg_minuto AS Minuto,
                IF(reg_estado = 1, 'Entrada Servicio',
                IF(reg_estado = 2, 'Salida Servicio', 
                IF(reg_estado = 3, 'Entrada Emisión', 'Salida Emisión'))) AS Razon
            FROM registro r, usuarios u 
            WHERE r.usua_codigo = u.usua_codigo
                AND u.empr_codigo = ${cEmpresa}
                AND reg_fecha BETWEEN '${fDesde} 'AND '${fHasta}'
                AND u.usua_codigo != 2
            ORDER BY reg_fecha desc, fecha;
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
/** ************************************************************************************************************ **
 ** **                                       ATENCION AL USUARIO                                              ** **
 ** ************************************************************************************************************ **/
router.get('/atencionusuario', (req, res) => {
    const query = `
        SELECT usua_nombre AS Nombre, serv_nombre AS Servicio,
            SUM(turn_estado = 1) AS Atendidos
        FROM usuarios u, turno t, cajero c, servicio s
        WHERE u.usua_codigo = c.usua_codigo 
            AND c.caje_codigo = t.caje_codigo 
            AND t.serv_codigo = s.serv_codigo 
        GROUP BY Nombre, Servicio
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
router.get('/atencionusuario/:fechaDesde/:fechaHasta/:cajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cajero;
    const query = `
        SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Nombre, serv_nombre AS Servicio, 
            SUM(turn_estado = 1) AS Atendidos 
        FROM usuarios u, turno t, cajero c, servicio s, empresa e 
        WHERE u.usua_codigo = c.usua_codigo 
            AND c.caje_codigo = t.caje_codigo 
            AND t.serv_codigo = s.serv_codigo 
            AND u.empr_codigo = e.empr_codigo 
            AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
            AND c.caje_codigo = ${cCajero} 
        GROUP BY Nombre, Servicio;
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
/** ************************************************************************************************************ **
 ** **                                          TURNOS POR FECHA                                              ** **
 ** ************************************************************************************************************ **/
router.get('/turnosfecha/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    const query = `
        SELECT usua_nombre AS Usuario, serv_nombre AS Servicio, turn_fecha AS Fecha, 
            SUM(turn_estado = 1) AS Atendidos, 
            SUM(turn_estado = 2 OR turn_estado = -1) AS No_Atendidos, 
            COUNT(turn_estado) AS Total 
        FROM turno t, servicio s, usuarios u, cajero c 
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo 
            AND turn_fecha = '${fechas}'  
        GROUP BY Fecha, Usuario, Servicio 
        ORDER BY Usuario, Fecha, Servicio;`;
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
router.get('/turnosfechas/:fechaDesde/:fechaHasta/:empresa', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == '-1') {
        query =
            `
            SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario, serv_nombre AS Servicio, 
                date_format(turn_fecha, '%Y-%m-%d') AS Fecha, 
                SUM(turn_estado = 1) AS Atendidos, 
                SUM(turn_estado = 2 OR turn_estado = -1) AS No_Atendidos, 
                SUM(turn_estado != 0) AS Total 
            FROM turno t, servicio s, usuarios u, cajero c, empresa e 
            WHERE t.serv_codigo = s.serv_codigo 
                AND t.caje_codigo = c.caje_codigo 
                AND u.usua_codigo = c.usua_codigo 
                AND u.empr_codigo = e.empr_codigo 
                AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
                AND u.usua_codigo != 2
            GROUP BY nombreEmpresa, Fecha, Usuario, Servicio 
            ORDER BY Fecha DESC, Usuario, Servicio;
            `;
    }
    else {
        query =
            `
            SELECT usua_nombre AS Usuario, serv_nombre AS Servicio, date_format(turn_fecha, '%Y-%m-%d') AS Fecha, 
                SUM(turn_estado = 1) AS Atendidos, 
                SUM(turn_estado = 2 OR turn_estado = -1) AS No_Atendidos, 
                SUM(turn_estado !=0) AS Total 
            FROM turno t, servicio s, usuarios u, cajero c 
            WHERE t.serv_codigo = s.serv_codigo 
                AND t.caje_codigo = c.caje_codigo 
                AND u.usua_codigo = c.usua_codigo 
                AND u.empr_codigo = ${cEmpresa}
                AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
                AND u.usua_codigo != 2
            GROUP BY Fecha, Usuario, Servicio 
            ORDER BY Fecha DESC, Usuario, Servicio;
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
exports.default = router;
