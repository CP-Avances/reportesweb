"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verifivarToken_1 = require("../libs/verifivarToken");
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ********************************************************************************************************** **
 ** **                                    TIEMPOS COMPLETOS                                                 ** **
 ** ********************************************************************************************************** **/
router.get('/tiemposcompletos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
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
                u.usua_nombre AS usuario,
                s.serv_nombre AS servicio, 
                ss.id AS id_subservicio, 
                ss.nombre AS subservicio,
                DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS fecha,
                TIME_FORMAT(SEC_TO_TIME(AVG(IFNULL(TIME_TO_SEC(t.turn_tiempoespera), 0))), '%H:%i:%s') AS tiempo_espera,
                AVG(IFNULL(TIME_TO_SEC(t.turn_tiempoespera), 0)) AS espera_segundos,
                TIME_FORMAT(SEC_TO_TIME(AVG(IFNULL(t.turn_duracionatencion, 0))), '%H:%i:%s') AS tiempo_atencion,
                AVG(IFNULL(t.turn_duracionatencion, 0)) AS atencion_segundos
            FROM 
                turno t
            JOIN servicio s ON t.serv_codigo = s.serv_codigo
            JOIN cajero c ON t.caje_codigo = c.caje_codigo
            JOIN usuarios u ON c.usua_codigo = u.usua_codigo
            JOIN empresa e ON u.empr_codigo = e.empr_codigo
            JOIN sub_servicio ss ON ss.id = t.id_sub_serv
        WHERE 
            u.usua_codigo != 2
            ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
        GROUP BY 
            e.empr_nombre, 
            s.serv_nombre, 
            u.usua_nombre, 
            t.turn_fecha, 
            ss.id, 
            ss.nombre
        ORDER BY 
            servicio ASC, 
            usuario ASC, 
            fecha DESC;
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
/** ****************************************************************************************************** **
 ** **                                      PROMEDIOS DE ATENCION                                       ** **
 ** ****************************************************************************************************** **/
router.get('/promediosatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaServicios = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todosServicios = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (serviciosArray.includes("-1")) {
        todosServicios = true;
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
                    t.serv_codigo, 
                    s.serv_nombre, 
                    ss.id AS id_subservicio, 
                    ss.nombre AS subservicio,
                    TIME_FORMAT(SEC_TO_TIME(AVG(TIME_TO_SEC(t.turn_tiempoespera))), '%H:%i:%s') AS promedio_espera,
                    AVG(TIME_TO_SEC(t.turn_tiempoespera)) AS espera_segundos,
                    TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS promedio_atencion,
                    AVG(t.turn_duracionatencion) AS atencion_segundos,
                    DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS turn_fecha, 
                    (SELECT MAX(turn_fecha) FROM turno) AS fecha_maxima,
                    (SELECT MIN(turn_fecha) FROM turno) AS fecha_minima
                FROM 
                    turno t
                    JOIN servicio s ON t.serv_codigo = s.serv_codigo
                    JOIN empresa e ON s.empr_codigo = e.empr_codigo
                    JOIN sub_servicio ss ON ss.id = t.id_sub_serv
                WHERE 
                    t.turn_estado = 1
                    AND t.caje_codigo != 0
                    AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
                    ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
                    ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                GROUP BY 
                    e.empr_nombre, 
                    t.serv_codigo, 
                    s.serv_nombre, 
                    ss.id, 
                    ss.nombre, 
                    t.turn_fecha
                ORDER BY 
                    s.serv_nombre ASC, 
                    t.turn_fecha DESC;
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
/** ****************************************************************************************************** **
 ** **                                      TIEMPO DE ATENCION                                       ** **
 ** ****************************************************************************************************** **/
router.get('/tiempoatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaServicios = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todosServicios = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (serviciosArray.includes("-1")) {
        todosServicios = true;
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
                    c.caje_nombre AS cajero, 
                    CONCAT(s.serv_descripcion, t.turn_numero) AS turno, 
                    t.serv_codigo, 
                    s.serv_nombre, 
                    ss.id AS id_subservicio, 
                    ss.nombre AS subservicio,
                    SEC_TO_TIME(TIME_TO_SEC(t.turn_tiempoespera)) AS espera,
                    SEC_TO_TIME(t.turn_duracionatencion) AS atencion,
                    DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS turn_fecha,
                    CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS hora
                FROM 
                    turno t
                JOIN servicio s ON t.serv_codigo = s.serv_codigo
                JOIN cajero c ON t.caje_codigo = c.caje_codigo
                JOIN empresa e ON s.empr_codigo = e.empr_codigo
                JOIN sub_servicio ss ON t.id_sub_serv = ss.id
                WHERE 
                    t.turn_estado = 1
                    AND t.caje_codigo != 0
                    AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
                    ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
                    ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                ORDER BY 
                    c.caje_nombre ASC, 
                    s.serv_nombre ASC, 
                    t.turn_fecha DESC, 
                    hora DESC, 
                    t.turn_codigo DESC;
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
/** ************************************************************************************************************* **
 ** **                                        MAXIMOS DE ATENCION                                              ** **
 ** ************************************************************************************************************* **/
router.get('/maxatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaServicios = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todosServicios = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (serviciosArray.includes("-1")) {
        todosServicios = true;
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
                    t.serv_codigo, 
                    s.serv_nombre, 
                    ss.id AS id_subservicio, 
                    ss.nombre AS subservicio,
                    MAX(IFNULL(t.turn_duracionatencion, 0)) AS duracion,
                    SEC_TO_TIME(MAX(IFNULL(t.turn_duracionatencion, 0))) AS Maximo,
                    DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
                    (SELECT MAX(turn_fecha) FROM turno) AS fechamaxima,
                    (SELECT MIN(turn_fecha) FROM turno) AS fechaminima
                FROM 
                    turno t
                INNER JOIN servicio s ON t.serv_codigo = s.serv_codigo
                INNER JOIN empresa e ON s.empr_codigo = e.empr_codigo
                INNER JOIN sub_servicio ss ON ss.id = t.id_sub_serv
                WHERE 
                    t.caje_codigo != 0
                    AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
                    ${!todasSucursales ? `AND servicio.empr_codigo IN (${listaSucursales})` : ''}
                    ${!todosServicios ? `AND servicio.serv_codigo IN (${listaServicios})` : ''}
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                GROUP BY 
                    t.serv_codigo, 
                    t.turn_fecha, 
                    ss.id, 
                    ss.nombre 
                ORDER BY 
                    t.turn_fecha DESC;
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
/** ******************************************************************************************************* **
 ** **                                     ATENCION SERVICIO                                             ** **
 ** ******************************************************************************************************* **/
router.get('/atencionservicio/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
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
                    SUM(t.turn_estado NOT IN (1, 0)) AS NoAtendidos,
                    COUNT(*) AS total
                FROM 
                    usuarios u
                    INNER JOIN cajero c ON u.usua_codigo = c.usua_codigo
                    INNER JOIN turno t ON c.caje_codigo = t.caje_codigo
                    INNER JOIN servicio s ON t.serv_codigo = s.serv_codigo
                    INNER JOIN empresa e ON u.empr_codigo = e.empr_codigo
                    INNER JOIN sub_servicio ss ON ss.id = t.id_sub_serv
                WHERE 
                    u.usua_codigo != 2
                    AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                    ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
                    ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                GROUP BY 
                    e.empr_nombre, 
                    u.usua_nombre, 
                    s.serv_nombre, 
                    ss.id, 
                    ss.nombre
                ORDER BY 
                    Nombre ASC, 
                    Servicio ASC;
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
/** ***************************************************************************************************** **
 ** **                                   GRAFICO SERVICIO                                              ** **
 ** ***************************************************************************************************** **/
router.get('/graficoservicio/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
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
                SELECT 
                    e.empr_nombre AS nombreEmpresa,
                    s.serv_codigo AS id_servicio, 
                    s.serv_nombre AS Servicio, 
                    ss.id AS id_subservicio, 
                    ss.nombre AS subservicio,
                    SUM(t.turn_estado = 1) AS Atendidos,
                    SUM(t.turn_estado NOT IN (1, 0)) AS No_Atendidos,
                    SUM(t.turn_estado != 0) AS Total
                FROM 
                    turno t
                    INNER JOIN servicio s ON t.serv_codigo = s.serv_codigo
                    INNER JOIN cajero c ON t.caje_codigo = c.caje_codigo
                    INNER JOIN usuarios u ON u.usua_codigo = c.usua_codigo
                    INNER JOIN empresa e ON s.empr_codigo = e.empr_codigo
                    INNER JOIN sub_servicio ss ON ss.id = t.id_sub_serv
                WHERE 
                    u.usua_codigo != 2
                    AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                    ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                GROUP BY 
                    e.empr_nombre, 
                    s.serv_nombre, 
                    ss.id, 
                    ss.nombre,
                    s.serv_codigo
                ORDER BY 
                s.serv_nombre;
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
/** ********************************************************************************************************** **
 ** **                                             CLIENTE                                                  ** **
 ** ********************************************************************************************************** **/
router.get('/cliente/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
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
                SELECT e.empr_nombre AS empresa, 
	                u.usua_nombre AS usuario,
	                s.serv_nombre AS servicio, 
	                ss.id AS id_subservicio,
	                ss.nombre AS subservicio,
	                DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS fecha,
	                ct.nombre AS nombre, 
	                ct.cedula AS cedula, 
	                s.serv_descripcion AS siglas,
	                t.turn_numero AS numero  
                FROM turno t
                JOIN servicio s ON t.serv_codigo = s.serv_codigo 
                JOIN cajero c ON t.caje_codigo = c.caje_codigo
                JOIN usuarios u ON u.usua_codigo = c.usua_codigo
                JOIN empresa e ON u.empr_codigo = e.empr_codigo
                JOIN cliente_turno ct ON t.turn_codigo = ct.turn_codigo
                JOIN sub_servicio ss ON t.id_sub_serv = ss.id
                WHERE u.usua_codigo != 2
                    ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
                    ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                    AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
                GROUP BY empresa, servicio, usuario, fecha, nombre, cedula, siglas, numero, ss.id, ss.nombre 
                ORDER BY servicio, usuario, fecha DESC, numero ASC;
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
/** ************************************************************************************************************* **
 ** **                                               MENU                                                      ** **
 ** ************************************************************************************************************* **/
router.get('/promediosatencionmenu/:fecha', verifivarToken_1.TokenValidation, (req, res) => {
    let fechas = req.params.fecha;
    const query = `
            SELECT 
                t.SERV_CODIGO, 
                s.SERV_NOMBRE, 
                ss.id AS id_subservicio, 
                ss.nombre AS subservicio,
                SEC_TO_TIME(AVG(TIME_TO_SEC(STR_TO_DATE(turn_tiempoespera, '%T')))) AS PromedioEspera, 
                AVG(TIME_TO_SEC(STR_TO_DATE(turn_tiempoespera, '%T'))) AS Espera, 
                SEC_TO_TIME(AVG(turn_duracionatencion)) AS PromedioAtencion, 
                AVG(turn_duracionatencion) AS Atencion, 
                t.TURN_FECHA, 
                (SELECT MAX(turn_fecha) FROM turno) AS fechamaxima, 
                (SELECT MIN(turn_fecha) FROM turno) AS fechaminima 
            FROM 
                turno t
                INNER JOIN servicio s ON t.serv_codigo = s.serv_codigo
                INNER JOIN sub_servicio ss ON ss.id = t.id_sub_serv 
            WHERE 
                t.turn_estado = 1
                AND t.TURN_FECHA = '${fechas}'  
            GROUP BY 
                t.serv_codigo, 
                t.turn_fecha, 
                ss.id, 
                ss.nombre
            ORDER BY 
                s.SERV_NOMBRE;
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
router.get("/identificacionCliente", verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
        SELECT gene_valor FROM general WHERE gene_codigo = 11;
        `;
    mysql_1.default.ejecutarQuery(query, (err, identificacion) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                valor: identificacion,
            });
        }
    });
});
exports.default = router;
