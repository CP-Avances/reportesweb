"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
///////////////////
//
//////////////////
///////////////////
//
//////////////////
///////////////////
//MENU
//////////////////
//////////////////////////
//TOTAL TICKETS EMITIDOS
/////////////////////////
router.get('/totaltickets/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio = req.params.anio;
    let mes = req.params.mes;
    let dia = req.params.dia;
    const fecha = anio + '-' + mes + '-' + dia;
    const query = "select turn_fecha as fecha, count(*) as numeroturnos from turno where turn_fecha = '" + fechas + "'";
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
//////////////////////////
//PROMEDIO DE ATENCION POR SERVICIO
/////////////////////////
router.get('/promedioatencionporservicio', (req, res) => {
    const query = `
    SELECT turn_codigo,  serv_nombre, date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') as PromedioAtencion
     FROM turno, servicio
     WHERE turno.serv_codigo = servicio.serv_codigo
     GROUP BY turn_codigo, serv_nombre;

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
///////////////////
//extras
//////////////////
//////////////////////////
//total atendios
/////////////////////////
router.get('/totalatendidos/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio = req.params.anio;
    let mes = req.params.mes;
    let dia = req.params.dia;
    const fecha = anio + '-' + mes + '-' + dia;
    const query = "select turn_fecha, count(*) as atendidostotales from turno  where turn_estado = 1 and turn_fecha = '" + fechas + "'";
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
//////////////////////////
//total sin atender
/////////////////////////
router.get('/totalsinatender/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio = req.params.anio;
    let mes = req.params.mes;
    let dia = req.params.dia;
    const fecha = anio + '-' + mes + '-' + dia;
    const query = "select turn_fecha, count(turn_codigo) as noatendidos from turno where turn_estado = 2 and turn_fecha = '" + fechas + "'";
    //and turn_estado = 0 and turn_estado = 3
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
//////////////////////////
//Promedio atencion
/////////////////////////
router.get('/promedioatencion/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio = req.params.anio;
    let mes = req.params.mes;
    let dia = req.params.dia;
    const fecha = anio + '-' + mes + '-' + dia;
    const query = "select turn_fecha, date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') as PromedioAtencion from turno where turn_fecha = '" + fechas + "'";
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
//////////////////////////
//Evaluacion promedio
/////////////////////////
router.get('/evapromedio', (req, res) => {
    const query = `
    select 
    IF(AVG(eval_califica)>=42,'Excelente',
IF(AVG(eval_califica)>=34,'Muy Bueno',
IF(AVG(eval_califica)>=26,'Bueno',
IF(AVG(eval_califica)>=18,'Regular',
IF(AVG(eval_califica)>=10,'Malo','No existe'))))) AS Promedio
from evaluacion;


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
//////////////////////////
//Evaluacion grafico
/////////////////////////
router.get('/evagraf', (req, res) => {
    const query = `
    select 
    sum(eval_califica=50) as Excelente,
    sum(eval_califica=40) as Muy_Bueno,
    sum(eval_califica=30) as Bueno,
    sum(eval_califica=20) as Regular,
    sum(eval_califica=10) as Malo,
    count(eval_califica) as Total,
    IF(AVG(eval_califica)>=42,'Excelente',
    IF(AVG(eval_califica)>=34,'Muy Bueno',
    IF(AVG(eval_califica)>=26,'Bueno',
    IF(AVG(eval_califica)>=18,'Regular',
    IF(AVG(eval_califica)>=10,'Malo','No existe'))))) AS Promedio
    from evaluacion;


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
//////////////////////////
//turnos con mas atenciones
/////////////////////////
router.get('/turnate', (req, res) => {
    const query = `
    select serv_nombre from servicio, turno
    where servicio.serv_codigo = turno.serv_codigo
    group by serv_nombre



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
//////////////////////////
//servicios mas solicitados
/////////////////////////
router.get('/servsoli', (req, res) => {
    const query = `
    select  serv_nombre as Servicio,
    sum( turn_estado = 1 ) as Atendidos,
    sum( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos,
    count( turn_estado ) as Total
    from turno t, servicio s, usuarios u, cajero c
    where t.serv_codigo = s.serv_codigo and
    t.caje_codigo = c.caje_codigo and
    u.usua_codigo = c.usua_codigo
    group by  Servicio
    order by Total desc
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
