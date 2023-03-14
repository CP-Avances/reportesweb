"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************ **
 ** **                                      SERVICIO                                                          ** **
 ** ************************************************************************************************************ **/
router.get("/promedios/:fechaDesde/:fechaHasta/:cCajero/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre AS Usuario, date_format(f.eval_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(eval_califica = 40) AS Excelente, 
        SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) AS Regular,
        SUM(eval_califica = 10) AS Malo,COUNT(eval_califica) AS Total,
        IF(AVG(eval_califica) >= 34,'Excelente',
        IF(AVG(eval_califica) >= 26,'Bueno',
        IF(AVG(eval_califica) >= 18,'Regular',
        IF(AVG(eval_califica) >= 10,'Malo','No existe')))) AS Promedio 
      FROM usuarios a, evaluacion f, empresa e, turno t, servicio s 
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo 
        AND S.serv_codigo = t.serv_codigo 
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND f.turn_codigo = t.turn_codigo 
        AND S.serv_codigo = ${cCajero}
        AND eval_califica != 50
        AND a.usua_codigo != 2
        GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
    else {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre AS Usuario, date_format(f.eval_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(eval_califica = 50) AS Excelente, 
        SUM(eval_califica = 40) AS Muy_Bueno,
        SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) AS Regular,
        SUM(eval_califica = 10) AS Malo,COUNT(eval_califica) AS Total,
        IF(AVG(eval_califica) >= 42,'Excelente',
        IF(AVG(eval_califica) >= 34,'Muy Bueno',
        IF(AVG(eval_califica) >= 26,'Bueno',
        IF(AVG(eval_califica) >= 18,'Regular',
        IF(AVG(eval_califica) >= 10,'Malo','No existe'))))) AS Promedio 
      FROM usuarios a, evaluacion f, empresa e, turno t, servicio s 
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo 
        AND S.serv_codigo = t.serv_codigo 
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND f.turn_codigo = t.turn_codigo 
        AND S.serv_codigo = ${cCajero}
        AND a.usua_codigo != 2
        GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
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
router.get("/getallservicios", (req, res) => {
    const query = `
    SELECT * FROM servicio ORDER BY serv_nombre;
    `;
    mysql_1.default.ejecutarQuery(query, (err, servicios) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                servicios,
            });
        }
    });
});
router.get("/getallservicios/:empresa", (req, res) => {
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == '-1') {
        query =
            `
      SELECT * FROM servicio WHERE serv_codigo != 1 ORDER BY serv_nombre;
      `;
    }
    else {
        query =
            `
      SELECT * FROM servicio WHERE empr_codigo = ${cEmpresa} AND Serv_codigo != 1 ORDER BY serv_nombre;
      `;
    }
    mysql_1.default.ejecutarQuery(query, (err, servicios) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                servicios,
            });
        }
    });
});
/** ************************************************************************************************************ **
 ** **                                      MAXIMOS Y MINIMOS                                                 ** **
 ** ************************************************************************************************************ **/
router.get("/maximosminimos/:fechaDesde/:fechaHasta/:cCajero/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre AS Usuario, date_format(f.eval_fecha, '%Y-%m-%d') AS Fecha,
        SUM(eval_califica = 40) AS Excelente,
        SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) AS Regular,
        SUM(eval_califica = 10) AS Malo,
        COUNT(eval_califica) AS Total,
      IF(SUM(eval_califica = 40) >= SUM(eval_califica = 30)
        AND SUM(eval_califica = 40) >= SUM(eval_califica = 20)
        AND SUM(eval_califica = 40) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 40) AS char), ' (E)'),
      IF(SUM(eval_califica = 30) >= SUM(eval_califica = 20)
        AND SUM(eval_califica = 30) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 30) AS char), ' (B)'),
      IF(SUM(eval_califica = 20) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 20) AS char), ' (R)'),
        CONCAT(CAST(SUM(eval_califica = 10) AS char),' (M)')))) AS max,
      IF(SUM(eval_califica = 40) < SUM(eval_califica = 30)
        AND SUM(eval_califica = 40) < SUM(eval_califica = 20)
        AND SUM(eval_califica = 40) < SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 40) AS char),' (E)'),
      IF(SUM(eval_califica = 30) < SUM(eval_califica = 20)
        AND SUM(eval_califica = 30) < SUM(eval_califica = 10),  
        CONCAT(CAST(SUM(eval_califica = 30) AS char), ' (B)'),
      IF(SUM(eval_califica = 20)< SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 20) AS char), ' (R)'),
        CONCAT(CAST(SUM(eval_califica = 10) AS char),' (M)')))) AS min
      FROM  usuarios a, evaluacion f ,empresa e, turno t, servicio s
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo 
        AND S.serv_codigo = t.serv_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND f.turn_codigo = t.turn_codigo
        AND S.serv_codigo = ${cCajero}
        AND eval_califica != 50
        AND a.usua_codigo != 2
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
    else {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre AS Usuario, date_format(f.eval_fecha, '%Y-%m-%d') AS Fecha,
        SUM(eval_califica = 50) AS Excelente,
        SUM(eval_califica = 40) AS Muy_Bueno,
        SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) AS Regular,
        SUM(eval_califica = 10) AS Malo,
        COUNT(eval_califica) AS Total,
      IF(SUM(eval_califica = 50) >= SUM(eval_califica = 40)
        AND SUM(eval_califica = 50) >= SUM(eval_califica = 30)
        AND SUM(eval_califica = 50) >= SUM(eval_califica = 20)
        AND SUM(eval_califica = 50) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 50) AS char), ' (E)'),
      IF(SUM(eval_califica = 40) >= SUM(eval_califica = 30)
        AND SUM(eval_califica = 40) >= SUM(eval_califica = 20)
        AND SUM(eval_califica = 40) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 40) AS char), ' (MB)'),
      IF(SUM(eval_califica = 30) >= SUM(eval_califica = 20)
        AND SUM(eval_califica = 30) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 30) AS char), ' (B)'),
      IF(SUM(eval_califica = 20) >= SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 20) AS char), ' (R)'),
        CONCAT(CAST(SUM(eval_califica = 10) AS char),' (M)'))))) AS max,
      IF(SUM(eval_califica = 50) < SUM(eval_califica = 40)
        AND SUM(eval_califica = 50) < SUM(eval_califica = 30)
        AND SUM(eval_califica = 50) < SUM(eval_califica = 20)
        AND SUM(eval_califica = 50) < SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 50) AS char),' (E)'),
      IF(SUM(eval_califica = 40) < SUM(eval_califica = 30)
        AND SUM(eval_califica = 40) < SUM(eval_califica = 20)
        AND SUM(eval_califica = 40) < SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 40) AS char),' (MB)'),
      IF(SUM(eval_califica = 30) < SUM(eval_califica = 20)
        AND SUM(eval_califica = 30) < SUM(eval_califica = 10),  
        CONCAT(CAST(SUM(eval_califica = 30) AS char), ' (B)'),
      IF(SUM(eval_califica = 20)< SUM(eval_califica = 10),
        CONCAT(CAST(SUM(eval_califica = 20) AS char), ' (R)'),
        CONCAT(CAST(SUM(eval_califica = 10) AS char),' (M)'))))) AS min
      FROM  usuarios a, evaluacion f ,empresa e, turno t, servicio s
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo 
        AND S.serv_codigo = t.serv_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND f.turn_codigo = t.turn_codigo
        AND S.serv_codigo = ${cCajero}
        AND a.usua_codigo != 2
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
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
 ** **                                           EMPLEADO                                                     ** **
 ** ************************************************************************************************************ **/
router.get("/promediose/:fechaDesde/:fechaHasta/:cCajero/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
      SUM(eval_califica = 40) AS Excelente,
      SUM(eval_califica = 30) AS Bueno,
      SUM(eval_califica = 20) AS Regular,
      SUM(eval_califica = 10) AS Malo,
      count(eval_califica) AS Total,
      IF(AVG(eval_califica) >= 34, 'ExcelenteMuy Bueno',
      IF(AVG(eval_califica) >= 26, 'Bueno',
      IF(AVG(eval_califica) >= 18, 'Regular',
      IF(AVG(eval_califica) >= 10, 'Malo', 'No existe')))) AS Promedio
      FROM usuarios a, evaluacion f ,empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
        AND eval_califica != 50
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
    else {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
      SUM(eval_califica = 50) AS Excelente,
      SUM(eval_califica = 40) AS Muy_Bueno,
      SUM(eval_califica = 30) AS Bueno,
      SUM(eval_califica = 20) AS Regular,
      SUM(eval_califica = 10) AS Malo,
      count(eval_califica) AS Total,
      IF(AVG(eval_califica) >= 42, 'Excelente',
      IF(AVG(eval_califica) >= 34, 'Muy Bueno',
      IF(AVG(eval_califica) >= 26, 'Bueno',
      IF(AVG(eval_califica) >= 18, 'Regular',
      IF(AVG(eval_califica) >= 10, 'Malo', 'No existe'))))) AS Promedio
      FROM usuarios a, evaluacion f ,empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
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
 ** **                                    MAXIMOS Y MINIMOS EMPLEADO                                          ** **
 ** ************************************************************************************************************ **/
router.get("/maximosminimose/:fechaDesde/:fechaHasta/:cCajero/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
        SUM(eval_califica = 40) AS Excelente,
        SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) AS Regular,
        SUM(eval_califica = 10) AS Malo,
      COUNT(eval_califica) AS Total,
      IF(SUM(eval_califica = 40) >= SUM(eval_califica = 30)
      AND SUM(eval_califica = 40) >= SUM(eval_califica = 20)
      AND SUM(eval_califica = 40) >= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 40)as char),' (E)'),
      IF(SUM(eval_califica = 30) >= SUM(eval_califica = 20)
      AND SUM(eval_califica = 30) >= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 30)as char),' (B)'),
      IF(SUM(eval_califica = 20)>= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 20)as char),' (R)'),
      CONCAT(CAST(SUM(eval_califica =10)as char),' (M)')))) AS max,
      IF(SUM(eval_califica = 40) < SUM(eval_califica = 30)
      AND SUM(eval_califica = 40) < SUM(eval_califica = 20)
      AND SUM(eval_califica = 40) < SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 40) AS char),' (E)'),
      IF(SUM(eval_califica = 30) < SUM(eval_califica = 20)
      AND SUM(eval_califica = 30) < SUM(eval_califica = 10),  
      CONCAT(CAST(SUM(eval_califica = 30) AS char),' (B)'),
      IF(SUM(eval_califica = 20)< SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 20) AS char),' (R)'),
      CONCAT(CAST(SUM(eval_califica = 10) AS char),' (M)')))) AS min
      FROM usuarios a, evaluacion f, empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
        AND eval_califica != 50
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
    else {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
        SUM(eval_califica = 50) AS Excelente,
        SUM(eval_califica = 40) AS Muy_Bueno,
        SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) AS Regular,
        SUM(eval_califica = 10) AS Malo,
      COUNT(eval_califica) AS Total,
      IF(SUM(eval_califica = 50) >= SUM(eval_califica = 40)
      AND SUM(eval_califica = 50) >= SUM(eval_califica = 30)
      AND SUM(eval_califica = 50) >= SUM(eval_califica = 20)
      AND SUM(eval_califica = 50) >= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 50) AS char),' (E)'),
      IF(SUM(eval_califica = 40) >= SUM(eval_califica = 30)
      AND SUM(eval_califica = 40) >= SUM(eval_califica = 20)
      AND SUM(eval_califica = 40) >= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 40)as char),' (MB)'),
      IF(SUM(eval_califica = 30) >= SUM(eval_califica = 20)
      AND SUM(eval_califica = 30) >= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 30)as char),' (B)'),
      IF(SUM(eval_califica = 20)>= SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 20)as char),' (R)'),
      CONCAT(CAST(SUM(eval_califica =10)as char),' (M)'))))) AS max,
      IF(SUM(eval_califica = 50) < SUM(eval_califica = 40)
      AND SUM(eval_califica = 50) < SUM(eval_califica = 30)
      AND SUM(eval_califica = 50) < SUM(eval_califica = 20)
      AND SUM(eval_califica = 50) < SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 50) AS char),' (E)') ,
      IF(SUM(eval_califica = 40) < SUM(eval_califica = 30)
      AND SUM(eval_califica = 40) < SUM(eval_califica = 20)
      AND SUM(eval_califica = 40) < SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 40) AS char),' (MB)'),
      IF(SUM(eval_califica = 30) < SUM(eval_califica = 20)
      AND SUM(eval_califica = 30) < SUM(eval_califica = 10),  
      CONCAT(CAST(SUM(eval_califica = 30) AS char),' (B)'),
      IF(SUM(eval_califica = 20)< SUM(eval_califica = 10),
      CONCAT(CAST(SUM(eval_califica = 20) AS char),' (R)'),
      CONCAT(CAST(SUM(eval_califica = 10) AS char),' (M)'))))) AS min
      FROM usuarios a, evaluacion f, empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
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
 ** **                                     EVALUACIONES OMITIDAS                                              ** **
 ** ************************************************************************************************************ **/
router.get("/omitidas/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = `
      SELECT e.empr_nombre as nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
        COUNT(eval_califica) AS Total
      FROM  usuarios a, noevaluacion f ,empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
      GROUP BY  f.eval_fecha, f.usua_codigo;
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
 ** **                                              GRAFICOS                                                  ** **
 ** ************************************************************************************************************ **/
router.get("/graficobarras/:opcion", (req, res) => {
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
    SELECT eval_califica, COUNT(eval_califica) AS total,
      IF((eval_califica) = 40, 'Excelente',
      IF((eval_califica) >= 30, 'Bueno',
      IF((eval_califica) >= 20, 'Regular',
      IF((eval_califica) >= 10, 'Malo', 'No existe')))) AS evaluacion,
		ROUND((COUNT(eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c 
        FROM evaluacion, usuarios 
        WHERE evaluacion.usua_codigo = usuarios.usua_codigo 
        AND eval_califica != 50
    GROUP BY eval_califica)as tl),2) AS porcentaje
    FROM evaluacion, usuarios 
    WHERE evaluacion.usua_codigo = usuarios.usua_codigo
    AND eval_califica != 50
    GROUP BY eval_califica ORDER BY eval_califica DESC;
    `;
    }
    else {
        query =
            `
    SELECT eval_califica, COUNT(eval_califica) AS total,
      IF((eval_califica) = 50, 'Excelente',
      IF((eval_califica) >= 40, 'Muy Bueno',
      IF((eval_califica) >= 30, 'Bueno',
      IF((eval_califica) >= 20, 'Regular',
      IF((eval_califica) >= 10, 'Malo', 'No existe'))))) AS evaluacion,
		ROUND((COUNT(eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c 
        FROM evaluacion, usuarios 
        WHERE evaluacion.usua_codigo = usuarios.usua_codigo 
    GROUP BY eval_califica)as tl),2) AS porcentaje
    FROM evaluacion, usuarios 
    WHERE evaluacion.usua_codigo = usuarios.usua_codigo
    GROUP BY eval_califica ORDER BY eval_califica DESC;
    `;
    }
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
router.get("/graficobarrasfiltro/:fechaDesde/:fechaHasta/:cCajero/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, eval_califica, COUNT(eval_califica) AS total, usua_nombre AS usuario,
        IF((eval_califica) = 40, 'Excelente',
        IF((eval_califica) >= 30, 'Bueno',
        IF((eval_califica) >= 20, 'Regular',
        IF((eval_califica) >= 10, 'Malo', 'No existe')))) AS evaluacion,
      ROUND((COUNT(eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c 
      FROM evaluacion, usuarios, cajero
      WHERE evaluacion.usua_codigo = usuarios.usua_codigo
        AND usuarios.usua_codigo = cajero.usua_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND cajero.caje_codigo = ${cCajero}
        AND eval_califica != 50
      GROUP BY eval_califica)as tl),3) AS porcentaje
      FROM evaluacion, usuarios, cajero, empresa e 
      WHERE evaluacion.usua_codigo = usuarios.usua_codigo
        AND usuarios.usua_codigo = cajero.usua_codigo
        AND usuarios.empr_codigo = e.empr_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND cajero.caje_codigo = ${cCajero}
        AND eval_califica != 50
      GROUP BY eval_califica, usua_nombre 
      ORDER BY eval_califica DESC;
      `;
    }
    else {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, eval_califica, COUNT(eval_califica) AS total, usua_nombre AS usuario,
        IF((eval_califica) = 50, 'Excelente',
        IF((eval_califica) >= 40, 'Muy Bueno',
        IF((eval_califica) >= 30, 'Bueno',
        IF((eval_califica) >= 20, 'Regular',
        IF((eval_califica) >= 10, 'Malo', 'No existe'))))) AS evaluacion,
      ROUND((COUNT(eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c 
      FROM evaluacion, usuarios, cajero
      WHERE evaluacion.usua_codigo = usuarios.usua_codigo
        AND usuarios.usua_codigo = cajero.usua_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND cajero.caje_codigo = ${cCajero}
      GROUP BY eval_califica)as tl),3) AS porcentaje
      FROM evaluacion, usuarios, cajero, empresa e 
      WHERE evaluacion.usua_codigo = usuarios.usua_codigo
        AND usuarios.usua_codigo = cajero.usua_codigo
        AND usuarios.empr_codigo = e.empr_codigo
        AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND cajero.caje_codigo = ${cCajero}
      GROUP BY eval_califica, usua_nombre 
      ORDER BY eval_califica DESC;
      `;
    }
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
router.get("/graficopastel", (req, res) => {
    const query = `
    SELECT u.usua_nombre, e.eval_califica, COUNT(e.eval_califica) AS cuenta, 
      IF((eval_califica) = 50, 'Excelente',
      IF((eval_califica) = 40, 'Muy Bueno',
      IF((eval_califica) = 30, 'Bueno',
      IF((eval_califica) = 20, 'Regular',
      IF((eval_califica) = 10, 'Malo','No existe'))))) AS Evaluacion,
    ROUND((COUNT(e.eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c
      FROM evaluacion 
      GROUP BY eval_califica)as tl),2) AS porcentaje
    FROM usuarios u, evaluacion e
    WHERE e.usua_codigo = u.usua_codigo
    GROUP BY e.eval_califica ORDER BY e.eval_califica DESC;
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
 ** **                                       ESTABLECIMIENTO                                                  ** **
 ** ************************************************************************************************************ **/
router.get("/establecimiento/:fechaDesde/:fechaHasta/:empresa/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        if (cEmpresa == '-1') {
            query =
                `
          SELECT em.empr_nombre AS nombreEmpresa, date_format(eval_fecha, '%Y-%m-%d') AS fecha,
            SUM(eval_califica = 40) AS Excelente,
            SUM(eval_califica = 30) AS Bueno,
            SUM(eval_califica = 20) AS Regular,
            SUM(eval_califica = 10) AS Malo,
            COUNT(eval_califica) AS Total,
          IF(avg(eval_califica) >= 40, 'Excelente',
          IF(avg(eval_califica) >= 30, 'Bueno',
          IF(avg(eval_califica) >= 20, 'Regular',
          IF(avg(eval_califica) >= 10, 'Malo', 'No existe')))) AS Promedio
          FROM evaluacion e, turno t, servicio s, empresa em 
          WHERE t.turn_codigo = e.turn_codigo 
            AND t.serv_codigo = s.serv_codigo
            AND S.empr_codigo = em.empr_codigo
            AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
            AND eval_califica != 50
            AND t.caje_codigo != 0
          GROUP BY e.eval_fecha, nombreEmpresa;
          `;
        }
        else {
            query =
                `
          SELECT date_format(eval_fecha, '%Y-%m-%d') AS fecha,
            SUM(eval_califica = 40) AS Excelente,
            SUM(eval_califica = 30) AS Bueno,
            SUM(eval_califica = 20) AS Regular,
            SUM(eval_califica = 10) AS Malo,
            COUNT(eval_califica) AS Total,
          IF(avg(eval_califica) >= 40, 'Excelente',
          IF(avg(eval_califica) >= 30, 'Bueno',
          IF(avg(eval_califica) >= 20, 'Regular',
          IF(avg(eval_califica) >= 10, 'Malo', 'No existe')))) AS Promedio
          FROM evaluacion e, turno t, servicio s 
          WHERE t.turn_codigo = e.turn_codigo 
            AND t.serv_codigo = s.serv_codigo
            AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            AND S.empr_codigo = ${cEmpresa}
            AND eval_califica != 50
            AND t.caje_codigo != 0
          GROUP BY e.eval_fecha; 
        `;
        }
    }
    else {
        if (cEmpresa == '-1') {
            query =
                `
          SELECT em.empr_nombre AS nombreEmpresa, date_format(eval_fecha, '%Y-%m-%d') AS fecha,
            SUM(eval_califica = 50) AS Excelente,
            SUM(eval_califica = 40) AS Muy_Bueno,
            SUM(eval_califica = 30) AS Bueno,
            SUM(eval_califica = 20) AS Regular,
            SUM(eval_califica = 10) AS Malo,
            COUNT(eval_califica) AS Total,
          IF(avg(eval_califica) = 50, 'Excelente',
          IF(avg(eval_califica) >= 40, 'Muy Bueno',
          IF(avg(eval_califica) >= 30, 'Bueno',
          IF(avg(eval_califica) >= 20, 'Regular',
          IF(avg(eval_califica) >= 10, 'Malo', 'No existe'))))) AS Promedio
          FROM evaluacion e, turno t, servicio s, empresa em 
          WHERE t.turn_codigo = e.turn_codigo 
            AND t.serv_codigo = s.serv_codigo
            AND S.empr_codigo = em.empr_codigo
            AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
            AND t.caje_codigo !=0
          GROUP BY e.eval_fecha, nombreEmpresa;
          `;
        }
        else {
            query =
                `
          SELECT date_format(eval_fecha, '%Y-%m-%d') AS fecha,
            SUM(eval_califica = 50) AS Excelente,
            SUM(eval_califica = 40) AS Muy_Bueno,
            SUM(eval_califica = 30) AS Bueno,
            SUM(eval_califica = 20) AS Regular,
            SUM(eval_califica = 10) AS Malo,
            COUNT(eval_califica) AS Total,
          IF(avg(eval_califica) = 50, 'Excelente',
          IF(avg(eval_califica) >= 40, 'Muy Bueno',
          IF(avg(eval_califica) >= 30, 'Bueno',
          IF(avg(eval_califica) >= 20, 'Regular',
          IF(avg(eval_califica) >= 10, 'Malo', 'No existe'))))) AS Promedio
          FROM evaluacion e, turno t, servicio s 
          WHERE t.turn_codigo = e.turn_codigo 
            AND t.serv_codigo = s.serv_codigo
            AND eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            AND S.empr_codigo = ${cEmpresa}
            AND t.caje_codigo !=0
          GROUP BY e.eval_fecha; 
        `;
        }
    }
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
 ** **                                       EVALUACION POR GRUPOS                                            ** **
 ** ************************************************************************************************************ **/
router.get("/evaluaciongrupos/:fechaDesde/:fechaHasta/:cCajero/:opcion", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const opcion = req.params.opcion;
    let query;
    if (opcion == "true") {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
        SUM(eval_califica = 40) + SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) + SUM(eval_califica = 10) AS Malo,
        COUNT(eval_califica) AS Total,
      IF(avg(eval_califica) >= 30, 'Bueno',
      IF(avg(eval_califica) >= 10, 'Malo', 'No existe')) AS Promedio
      FROM  usuarios a, evaluacion f ,empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
        AND eval_califica != 50
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
    else {
        query =
            `
      SELECT e.empr_nombre AS nombreEmpresa, a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') AS fecha,
        SUM(eval_califica = 50) + SUM(eval_califica = 40) + SUM(eval_califica = 30) AS Bueno,
        SUM(eval_califica = 20) + SUM(eval_califica = 10) AS Malo,
        COUNT(eval_califica) AS Total,
      IF(avg(eval_califica) >= 30, 'Bueno',
      IF(avg(eval_califica) >= 10, 'Malo', 'No existe')) AS Promedio
      FROM  usuarios a, evaluacion f ,empresa e, cajero c
      WHERE a.usua_codigo = f.usua_codigo
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo = c.usua_codigo
        AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND c.caje_codigo = ${cCajero}
      GROUP BY f.eval_fecha, f.usua_codigo;
      `;
    }
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
router.get("/opcionesEvaluacion", (req, res) => {
    const query = `
    select gene_valor from general where gene_codigo = 7;
    `;
    mysql_1.default.ejecutarQuery(query, (err, opcion) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                opcion: opcion,
            });
        }
    });
});
exports.default = router;