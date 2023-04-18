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
router.get("/turnosfecha", (req, res) => {
    const query = `
        SELECT usua_nombre as Usuario, serv_nombre as Servicio,
            date_format(turn_fecha, "%Y-%m-%d") as Fecha, SUM(turn_estado = 1) AS Atendidos,
            SUM( turn_estado != 1 AND turn_estado != 0) AS No_Atendidos,
            SUM(turn_estado != 0) AS Total 
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
router.get("/getallsucursales", (req, res) => {
    const query = `
        SELECT * FROM empresa ORDER BY empr_nombre ASC;
        `;
    mysql_1.default.ejecutarQuery(query, (err, empresas) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
            console.log(err);
        }
        else {
            res.json({
                ok: true,
                empresas,
            });
        }
    });
});
router.get("/getallcajeros", (req, res) => {
    const query = `
        SELECT * FROM cajero usua_codigo != 2 ORDER BY caje_nombre ASC;
        `;
    mysql_1.default.ejecutarQuery(query, (err, cajeros) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                cajeros,
            });
        }
    });
});
router.get("/getallcajeros/:sucursales", (req, res) => {
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    const query = `
            SELECT c.caje_codigo, c.usua_codigo, c.caje_nombre, c.caje_estado 
            FROM cajero c, usuarios u 
            WHERE u.usua_codigo = c.usua_codigo
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            AND u.usua_codigo != 2
            ORDER BY c.caje_nombre ASC;
            `;
    mysql_1.default.ejecutarQuery(query, (err, cajeros) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
            console.log(err);
        }
        else {
            res.json({
                ok: true,
                cajeros,
            });
        }
    });
});
/** ************************************************************************************************************ **
 ** **                               TIEMPO PROMEDIO DE ATENCION                                              ** **
 ** ************************************************************************************************************ **/
router.get("/tiempopromedioatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    if (codigosArray.includes("-2")) {
        todosCajeros = true;
    }
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    let query = `
    SELECT e.empr_nombre AS nombreEmpresa, serv_nombre AS Servicio, caje_nombre AS Nombre, 
    COUNT(turn_codigo) AS Turnos, 
    sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))) AS Promedio 
    FROM cajero c, turno t, servicio s, empresa e, usuarios u
    WHERE t.caje_codigo = c.caje_codigo 
    AND t.serv_codigo = s.serv_codigo 
    AND s.empr_codigo = e.empr_codigo  
    AND c.usua_codigo = u.usua_codigo
    AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
    AND u.usua_codigo != 2
    ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
    ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
    GROUP BY nombreEmpresa, Nombre, Servicio;
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
 ** **                               TIEMPO DE ATENCION POR TURNOS                                            ** **
 ** ************************************************************************************************************ **/
router.get("/tiempoatencionturnos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    if (codigosArray.includes("-2")) {
        todosCajeros = true;
    }
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    let query = `
    SELECT e.empr_nombre AS nombreEmpresa, CAST(CONCAT(s.serv_descripcion,t.turn_numero) AS CHAR) AS turno, serv_nombre AS Servicio, caje_nombre AS Nombre, 
    sec_to_time(IFNUll(turn_duracionatencion, 0)) AS atencion,
    date_format(t.TURN_FECHA, '%Y-%m-%d') AS TURN_FECHA
    FROM cajero c, turno t, servicio s, empresa e, usuarios u
    WHERE t.caje_codigo = c.caje_codigo 
    AND t.serv_codigo = s.serv_codigo 
    AND s.empr_codigo = e.empr_codigo  
    AND c.usua_codigo = u.usua_codigo
    AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
    AND u.usua_codigo != 2
    ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
    ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
    ORDER BY t.TURN_FECHA DESC;
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
router.get("/tiempopromedioatencion", (req, res) => {
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
 ** **                               ENTRADAS Y SALIDAD DEL SISTEMA                                           ** **
 ** ************************************************************************************************************ **/
router.get("/entradasalidasistema/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    let diaCompleto = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    const query = `
      SELECT e.empr_nombre AS nombreEmpresa,
      usua_nombre AS Usuario,
      CAST(STR_TO_DATE(concat(reg_fecha," ",reg_hora,":",reg_minuto,":00"),'%Y-%m-%d %H:%i:%s') AS CHAR) AS fecha,
      reg_hora as Hora, reg_minuto as Minuto,
      CASE r.reg_estado
                WHEN 1 THEN 'Entrada Servicio'
                WHEN 2 THEN 'Salida Servicio'
                WHEN 3 THEN 'Entrada Emisión'
                ELSE 'Salida Emisión'
            END AS Razon
      FROM registro r, usuarios u, empresa e
      WHERE r.usua_codigo = u.usua_codigo
      ${todasSucursales ? 'AND u.empr_codigo = e.empr_codigo' : `AND u.empr_codigo IN (${listaSucursales})`}
      AND reg_fecha BETWEEN '${fDesde}' AND '${fHasta}'
      ${!diaCompleto ? `AND r.reg_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
      AND u.usua_codigo != 2
      ORDER BY reg_fecha DESC, fecha;
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
 ** **                                       ATENCION AL USUARIO                                              ** **
 ** ************************************************************************************************************ **/
router.get("/atencionusuario", (req, res) => {
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
router.get("/atencionusuario/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    if (codigosArray.includes("-2")) {
        todosCajeros = true;
    }
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    const query = `
    SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Nombre, serv_nombre AS Servicio, 
        SUM(turn_estado = 1) AS Atendidos,
        SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
        SUM(turn_estado != 0) AS Total 
    FROM usuarios u, turno t, cajero c, servicio s, empresa e 
    WHERE u.usua_codigo = c.usua_codigo 
        AND c.caje_codigo = t.caje_codigo 
        AND t.serv_codigo = s.serv_codigo 
        AND u.empr_codigo = e.empr_codigo 
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND u.usua_codigo != 2 
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
        GROUP BY Nombre, Servicio;
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
 ** **                                          TURNOS POR FECHA                                              ** **
 ** ************************************************************************************************************ **/
router.get("/turnosfecha/:fecha", (req, res) => {
    let fechas = req.params.fecha;
    const query = `
        SELECT usua_nombre AS Usuario, serv_nombre AS Servicio, turn_fecha AS Fecha, 
            SUM(turn_estado = 1) AS Atendidos, 
            SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
            SUM(turn_estado != 0) AS Total  
        FROM turno t, servicio s, usuarios u, cajero c 
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo 
            AND turn_fecha = '${fechas}'  
        GROUP BY Fecha, Usuario, Servicio 
        ORDER BY Usuario, Fecha DESC, Servicio;`;
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
router.get("/turnosfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (cajerosArray.includes("-2")) {
        todasCajeros = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           s.serv_nombre AS Servicio, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
           SUM(turn_estado = 1) AS Atendidos, 
           SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
           SUM(turn_estado != 0) AS Total 
    FROM turno t 
    JOIN servicio s ON t.serv_codigo = s.serv_codigo 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
      ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
      ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
    GROUP BY nombreEmpresa, Fecha, Usuario, Servicio 
    ORDER BY Fecha DESC, Usuario, Servicio;
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
router.get("/turnostotalfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (cajerosArray.includes("-2")) {
        todasCajeros = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
           SUM(turn_estado = 1) AS Atendidos, 
           SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
           SUM(turn_estado != 0) AS Total 
    FROM turno t 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
      ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
      ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
    GROUP BY nombreEmpresa, Fecha, Usuario
    ORDER BY Fecha DESC, Usuario;
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
router.get("/turnosmeta/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (cajerosArray.includes("-2")) {
        todasCajeros = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
           SUM(turn_estado = 1) AS Atendidos, 
           ROUND((SUM(turn_estado = 1) / (SELECT gene_valor FROM general WHERE gene_codigo = 9)) * 100,2) AS Porcentaje_Atendidos
    FROM turno t 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
      ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
      ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
    GROUP BY nombreEmpresa, Fecha, Usuario
    ORDER BY Fecha DESC, Usuario;
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
