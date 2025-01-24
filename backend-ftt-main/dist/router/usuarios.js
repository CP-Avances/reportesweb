"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verifivarToken_1 = require("../libs/verifivarToken");
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************ **
 ** **                                      TURNOS POR FECHA                                                  ** **
 ** ************************************************************************************************************ **/
router.get("/turnosfecha", verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
      SELECT 
        u.usua_nombre AS Usuario,
        s.serv_nombre AS Servicio,
        sub.id as id_subservicio,
        sub.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, "%Y-%m-%d") AS Fecha,
        SUM(t.turn_estado = 1) AS Atendidos,
        SUM(t.turn_estado NOT IN (1, 0)) AS No_Atendidos,
        SUM(t.turn_estado != 0) AS Total
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON c.usua_codigo = u.usua_codigo
      INNER JOIN 
        sub_servicio sub ON sub.id = t.id_sub_serv
      GROUP BY 
        u.usua_nombre, s.serv_nombre, sub.nombre, DATE_FORMAT(t.turn_fecha, "%Y-%m-%d")
      ORDER BY 
        u.usua_nombre, Fecha, s.serv_nombre;
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
router.get("/getallsucursales", verifivarToken_1.TokenValidation, (req, res) => {
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
router.get("/getallcajeros", verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
      SELECT * FROM cajero 
      WHERE usua_codigo != 2 AND caje_estado = 2 
      ORDER BY caje_nombre ASC;
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
// METODO DE CAJEROS CON ESTADO
router.get("/cajerosEstado/estado", verifivarToken_1.TokenValidation, (req, res) => {
    const estado_usuario = req.params.estado;
    // 1 --> INACTIVOS
    // 2 --> ACTIVOS
    // 3 --> TODOS
    const query = `
      SELECT * FROM cajero 
      WHERE usua_codigo != 2 AND caje_estado = ${estado_usuario}
      ORDER BY caje_nombre ASC;
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
router.get("/getallcajeros/:sucursales", verifivarToken_1.TokenValidation, (req, res) => {
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
// METODO DE BUSQUEDA DE CAJEROS DE ACUERDO A LA SUCURSAL Y ESTADO
router.get("/getallcajeros/:sucursales/:estado", verifivarToken_1.TokenValidation, (req, res) => {
    // 1 --> INACTIVOS
    // 2 --> ACTIVOS
    // 3 --> TODOS
    // FILTROS SUCURSALES
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    // VALIDACIONES SUCURSALES
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    // FILTROS ESTADO
    const estado_usuario = req.params.estado;
    let estado = ``;
    if (estado_usuario != 3) {
        estado = `AND c.caje_estado = ${estado_usuario}`;
    }
    const query = `
      SELECT c.caje_codigo, c.usua_codigo, c.caje_nombre, c.caje_estado 
      FROM cajero c, usuarios u 
      WHERE u.usua_codigo = c.usua_codigo
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        AND u.usua_codigo != 2
        ${estado}
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
router.get("/tiempopromedioatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales/:servicios/:subservicios/:estado", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios);
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios);
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    console.log("ver estado", estado);
    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;
    if (codigosArray.includes("-2")) {
        todosCajeros = true;
    }
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (Serviciosarray.includes("-1")) {
        todosServicios = true;
    }
    if (subServiciosarray.includes("-1")) {
        todosSubservicio = true;
    }
    let comprobarestado = '';
    if (estado == '3') {
        comprobarestado = `c.caje_estado != 0`;
    }
    else {
        comprobarestado = `c.caje_estado = ${estado}`;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    let query = '';
    if (listaServicios != '0' && listaSubservicios != '0') {
        query =
            `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          s.serv_nombre AS Servicio, 
          c.caje_nombre AS Nombre,
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          COUNT(t.turn_codigo) AS Turnos, 
          TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS Promedio
        FROM 
          turno t
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
        WHERE 
          u.usua_codigo != 2
          AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre, s.serv_nombre, c.caje_nombre, ss.id, ss.nombre;
      `;
    }
    else if (listaSubservicios == '0' && listaServicios != '0') {
        query =
            `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          s.serv_nombre AS Servicio, 
          c.caje_nombre AS Nombre,
          COUNT(t.turn_codigo) AS Turnos, 
          TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS Promedio
        FROM 
          turno t
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
        WHERE 
          u.usua_codigo != 2
          AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre, s.serv_nombre, c.caje_nombre;
      `;
    }
    else if (listaServicios == '0' && listaSubservicios == '0') {
        query =
            `
      SELECT 
        e.empr_nombre AS nombreEmpresa, 
        c.caje_nombre AS Nombre,
        COUNT(t.turn_codigo) AS Turnos, 
        TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS Promedio
      FROM 
        turno t
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
          INNER JOIN 
        usuarios u ON c.usua_codigo = u.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
    
      WHERE 
        u.usua_codigo != 2
        AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      GROUP BY 
        e.empr_nombre, c.caje_nombre;
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
 ** **                               TIEMPO DE ATENCION POR TURNOS                                            ** **
 ** ************************************************************************************************************ **/
router.get("/tiempoatencionturnos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", verifivarToken_1.TokenValidation, (req, res) => {
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
    let hFinAux = 0;
    if (codigosArray.includes("-2")) {
        todosCajeros = true;
    }
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    let query = `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          CAST(CONCAT(s.serv_descripcion, t.turn_numero) AS CHAR) AS turno, 
          s.serv_nombre AS Servicio, 
          c.caje_nombre AS Nombre, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          SEC_TO_TIME(TIME_TO_SEC(t.turn_tiempoespera)) AS espera,
          SEC_TO_TIME(IFNULL(t.turn_duracionatencion, 0)) AS atencion,
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS turn_fecha,
          CAST(CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS CHAR) AS hora
        FROM 
          turno t
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        WHERE 
          u.usua_codigo != 2
          AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        ORDER BY 
          t.turn_codigo DESC, 
          t.turn_fecha DESC, 
          hora DESC;
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
router.get("/tiempopromedioatencion", verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
      SELECT 
        s.serv_nombre AS Servicio, 
        c.caje_nombre AS Nombre, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        COUNT(t.turn_codigo) AS Turnos, 
        TIME_FORMAT(SEC_TO_TIME(AVG(IFNULL(t.turn_duracionatencion, 0))), '%H:%i:%s') AS Promedio
      FROM 
        turno t
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        sub_servicio ss ON t.id_sub_serv = ss.id
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      GROUP BY 
        c.caje_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre;
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
router.get("/entradasalidasistema/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    const query = `
        SELECT e.empr_nombre AS nombreEmpresa,
          usua_nombre AS Usuario,
          CAST(STR_TO_DATE(reg_fecha,'%Y-%m-%d') AS CHAR) AS fecha,
          CAST(CONCAT(LPAD(reg_hora, 2, '0'), ':', LPAD(reg_minuto, 2, '0')) AS CHAR) AS hora,
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
          ${!diaCompleto ? `AND r.reg_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
          AND u.usua_codigo != 2
        ORDER BY fecha DESC, hora DESC;
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
router.get("/atencionusuario", verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
      SELECT 
        u.usua_nombre AS Nombre, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        SUM(t.turn_estado = 1) AS Atendidos
      FROM 
        usuarios u
      INNER JOIN 
        cajero c ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        turno t ON c.caje_codigo = t.caje_codigo
      INNER JOIN 
        sub_servicio ss ON t.id_sub_serv = ss.id
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      GROUP BY 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre;
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
router.get("/atencionusuario/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", verifivarToken_1.TokenValidation, (req, res) => {
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
    let hFinAux = 0;
    if (codigosArray.includes("-2")) {
        todosCajeros = true;
    }
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    const query = `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          u.usua_nombre AS Nombre, 
          s.serv_nombre AS Servicio, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          SUM(t.turn_estado = 1) AS Atendidos,
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total
        FROM 
          usuarios u
        INNER JOIN 
          cajero c ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
          turno t ON c.caje_codigo = t.caje_codigo
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
        WHERE 
          u.usua_codigo != 2
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre, 
          u.usua_nombre, 
          s.serv_nombre, 
          ss.id, 
          ss.nombre
        ORDER BY 
          u.usua_nombre ASC, 
          s.serv_nombre ASC;
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
router.get("/turnosfecha/:fecha", verifivarToken_1.TokenValidation, (req, res) => {
    let fechas = req.params.fecha;
    const query = `
      SELECT 
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        t.turn_fecha AS Fecha, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        SUM(t.turn_estado = 1) AS Atendidos, 
        SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
        SUM(t.turn_estado != 0) AS Total
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        sub_servicio ss ON t.id_sub_serv = ss.id
      WHERE 
        turn_fecha = '${fechas}'
      GROUP BY 
        t.turn_fecha, 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        u.usua_nombre ASC, 
        t.turn_fecha DESC, 
        s.serv_nombre ASC;
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
router.get("/turnosfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros/:servicios/:subservicios/:estado", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    console.log("ver listaSucursales: ", listaSucursales);
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    console.log("ver listaCajeros: ", listaCajeros);
    const cajerosArray = listaCajeros.split(",");
    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios);
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios);
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    console.log("ver estado", estado);
    let todasSucursales = false;
    let todasCajeros = false;
    let todosServicios = false;
    let todosSubservicio = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (cajerosArray.includes("-2")) {
        todasCajeros = true;
    }
    if (Serviciosarray.includes("-1")) {
        todosServicios = true;
    }
    if (subServiciosarray.includes("-1")) {
        todosSubservicio = true;
    }
    let comprobarestado = '';
    if (estado == '3') {
        comprobarestado = `c.caje_estado != 0`;
    }
    else {
        comprobarestado = `c.caje_estado = ${estado}`;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    let query = '';
    if (listaServicios != '0' && listaSubservicios != '0') {
        console.log("entra a listaServicios != '0' && listaSubservicios != '0'");
        query =
            `
        SELECT 
          e.empr_nombre AS nombreEmpresa,
          u.usua_nombre AS Usuario, 
          s.serv_nombre AS Servicio, 
          ss.id AS id_subservicio,
          ss.nombre AS subservicio,
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
          SUM(t.turn_estado = 1) AS Atendidos, 
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total
        FROM 
          turno t
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        WHERE 
          u.usua_codigo != 2
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
          u.usua_nombre, 
          s.serv_nombre, 
          ss.id, 
          ss.nombre
        ORDER BY 
          Fecha DESC, 
          Usuario ASC, 
          Servicio ASC;
      `;
    }
    else if (listaSubservicios == '0' && listaServicios != '0') {
        console.log("listaSubservicios == '0' && listaServicios != '0'");
        query =
            `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio,
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
        SUM(t.turn_estado = 1) AS Atendidos, 
        SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
        SUM(t.turn_estado != 0) AS Total
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        Usuario ASC, 
        Servicio ASC;
    `;
    }
    else if (listaServicios == '0' && listaSubservicios == '0') {
        console.log("listaServicios == '0' && listaSubservicios == '0'");
        query =
            `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio,
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
        SUM(t.turn_estado = 1) AS Atendidos, 
        SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
        SUM(t.turn_estado != 0) AS Total
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        Usuario ASC, 
        Servicio ASC;
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
router.get("/turnostotalfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros/:servicios/:subservicios/:estado", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios);
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios);
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    console.log("ver estado", estado);
    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (cajerosArray.includes("-2")) {
        todasCajeros = true;
    }
    if (Serviciosarray.includes("-1")) {
        todosServicios = true;
    }
    if (subServiciosarray.includes("-1")) {
        todosSubservicio = true;
    }
    let comprobarestado = '';
    if (estado == '3') {
        comprobarestado = `c.caje_estado != 0`;
    }
    else {
        comprobarestado = `c.caje_estado = ${estado}`;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    let query = '';
    if (listaServicios != '0' && listaSubservicios != '0') {
        query =
            `
        SELECT 
          e.empr_nombre AS nombreEmpresa,
          u.usua_nombre AS Usuario, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          s.serv_nombre AS Servicio, 

          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
          SUM(t.turn_estado = 1) AS Atendidos, 
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total
        FROM 
          turno t
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        WHERE 
          u.usua_codigo != 2
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
        GROUP BY 
          e.empr_nombre, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
          u.usua_nombre, 
          ss.id, 
          ss.nombre,
          s.serv_nombre

        ORDER BY 
          Fecha DESC, 
          Usuario ASC;
      `;
    }
    else if (listaSubservicios == '0' && listaServicios != '0') {
        query =
            `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(t.turn_estado = 1) AS Atendidos, 
        SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
        SUM(t.turn_estado != 0) AS Total
      FROM 
        turno t
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
    
      WHERE 
        u.usua_codigo != 2
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre, 
        s.serv_nombre

      ORDER BY 
        Fecha DESC, 
        Usuario ASC;
    `;
    }
    else if (listaServicios == '0' && listaSubservicios == '0') {
        query =
            `
        SELECT 
          e.empr_nombre AS nombreEmpresa,
          u.usua_nombre AS Usuario, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
          SUM(t.turn_estado = 1) AS Atendidos, 
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total
        FROM 
          turno t
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
    
        WHERE 
          u.usua_codigo != 2
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
        GROUP BY 
          e.empr_nombre, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
          u.usua_nombre 
      
        ORDER BY 
          Fecha DESC, 
          Usuario ASC;
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
router.get("/turnosmeta/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros/:servicios/:subservicios/:estado", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios);
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios);
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    console.log("ver estado", estado);
    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (cajerosArray.includes("-2")) {
        todasCajeros = true;
    }
    if (Serviciosarray.includes("-1")) {
        todosServicios = true;
    }
    if (subServiciosarray.includes("-1")) {
        todosSubservicio = true;
    }
    let comprobarestado = '';
    if (estado == '3') {
        comprobarestado = `c.caje_estado != 0`;
    }
    else {
        comprobarestado = `c.caje_estado = ${estado}`;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    let query = '';
    if (listaServicios != '0' && listaSubservicios != '0') {
        query =
            `
        SELECT 
          e.empr_nombre AS nombreEmpresa,
          u.usua_nombre AS Usuario,
          s.serv_nombre AS Servicio,  
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
          SUM(t.turn_estado = 1) AS Atendidos, 
          ROUND(
            (SUM(t.turn_estado = 1) / 
            (SELECT g.gene_valor FROM general g WHERE g.gene_codigo = 9)) * 100, 2) AS Porcentaje_Atendidos
        FROM 
          turno t
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        WHERE 
          u.usua_codigo != 2
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        GROUP BY 
          e.empr_nombre, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
          u.usua_nombre,
          s.serv_nombre, 
          ss.id, 
          ss.nombre
        ORDER BY 
          Fecha DESC, 
          Usuario ASC,
          Servicio ASC;
      `;
    }
    else if (listaSubservicios == '0' && listaServicios != '0') {
        query =
            `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(t.turn_estado = 1) AS Atendidos, 
        ROUND(
          (SUM(t.turn_estado = 1) / 
          (SELECT g.gene_valor FROM general g WHERE g.gene_codigo = 9)) * 100, 2) AS Porcentaje_Atendidos
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre,
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        Usuario ASC,
        Servicio ASC;

    `;
    }
    else if (listaServicios == '0' && listaSubservicios == '0') {
        query =
            `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(t.turn_estado = 1) AS Atendidos, 
        ROUND(
          (SUM(t.turn_estado = 1) / 
          (SELECT g.gene_valor FROM general g WHERE g.gene_codigo = 9)) * 100, 2) AS Porcentaje_Atendidos
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        Usuario ASC,
        Servicio ASC;
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
exports.default = router;
