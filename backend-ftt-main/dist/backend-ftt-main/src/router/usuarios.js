"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
////
const router = express_1.Router();
router.get('/turnosfecha', (req, res) => {
    const fecha = req.params.fecha;
    const query = `
    select usua_nombre as Usuario, serv_nombre as Servicio,
            date_format(turn_fecha,  "%Y-%m-%d") as Fecha, sum( turn_estado = 1 ) as Atendidos,
                    sum( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos,
                    count( turn_estado ) as Total
                    from turno t, servicio s, usuarios u, cajero c
                    where t.serv_codigo = s.serv_codigo and
                    t.caje_codigo = c.caje_codigo and
                    u.usua_codigo = c.usua_codigo and
                    turn_fecha
                    and turn_fecha
                    and u.usua_codigo
                    group by Fecha, Usuario, Servicio
                    order by Usuario, Fecha, Servicio;

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
    const query = `SELECT * FROM empresa ORDER BY empr_nombre;`;
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
    select * from cajero order by caje_nombre;

    `;
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
router.get('/tiempopromedioatencion', (req, res) => {
    const query = `
        select serv_nombre as Servicio, caje_nombre as Nombre,
        count(turn_codigo) as Turnos, date_format(sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))), '%H:%i:%s') as Promedio 
        from cajero c, turno t, servicio s 
        where t.caje_codigo = c.caje_codigo and 
        t.serv_codigo = s.serv_codigo and 
        t.turn_fecha  and
        t.turn_fecha  and
        t.turn_hora
        group by Nombre, Servicio
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
router.get('/entradasalidasistema/:fechaDesde/:fechaHasta', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "select usua_nombre as Usuario," +
        " concat(concat(dayofmonth(reg_fecha),'/',month(reg_fecha),'/'," +
        " year(reg_fecha)),'  ', if (reg_hora<=9, concat('0',reg_hora),reg_hora ), ':' ," +
        " if(reg_minuto<=9,concat('0',reg_minuto),reg_minuto) ) as fecha," +
        " reg_hora as Hora, reg_minuto as Minuto,if(reg_estado = 1, 'Entrada Servicio'," +
        " if(reg_estado = 2,  'Salida Servicio', if ( reg_estado = 3, 'Entrada Emisión'," +
        " 'Salida Emisión')  )) as Razon" +
        " from registro r, usuarios u where r.usua_codigo = u.usua_codigo" +
        " AND reg_fecha >= '" + fDesde + "'" +
        " AND reg_fecha <= '" + fHasta + "'" +
        " order by reg_fecha desc, fecha;";
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
router.get('/atencionusuario', (req, res) => {
    const query = `
    select usua_nombre as Nombre, serv_nombre as Servicio,
    sum(turn_estado = 1) as Atendidos
    from usuarios u, turno t, cajero c, servicio s
    where u.usua_codigo = c.usua_codigo and
    c.caje_codigo = t.caje_codigo and t.serv_codigo = s.serv_codigo AND
    turn_fecha AND
    turn_fecha and u.usua_codigo
    group by Nombre, Servicio
    
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
    const query = "select usua_nombre as Nombre, serv_nombre as Servicio, sum(turn_estado = 1) as Atendidos from usuarios u, turno t, cajero c, servicio s where u.usua_codigo = c.usua_codigo and  c.caje_codigo = t.caje_codigo and t.serv_codigo = s.serv_codigo AND  turn_fecha >= '" + fDesde + "' and turn_fecha <= '" + fHasta + "' and  c.caje_codigo = " + cCajero + " and  turn_fecha AND turn_fecha and u.usua_codigo  group by Nombre, Servicio ";
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
router.get('/turnosfecha/:fecha', (req, res) => {
    let fechas = req.params.fecha;
    let anio1 = req.params.anio;
    let mes1 = req.params.mes;
    let dia1 = req.params.dia;
    const fecha = anio1 + '-' + mes1 + '-' + dia1;
    const query = "select usua_nombre as Usuario, serv_nombre as Servicio, turn_fecha as Fecha, sum( turn_estado = 1 ) as Atendidos, sum( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos, count( turn_estado ) as Total from turno t, servicio s, usuarios u, cajero c where t.serv_codigo = s.serv_codigo and t.caje_codigo = c.caje_codigo and u.usua_codigo = c.usua_codigo and turn_fecha = '" + fechas + "' and turn_fecha = '" + fechas + "' and u.usua_codigo group by Fecha, Usuario, Servicio order by Usuario, Fecha, Servicio;";
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
    let fechas = req.params.fecha;
    let anio1 = req.params.anio;
    let mes1 = req.params.mes;
    let dia1 = req.params.dia;
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == '-1') {
        query = "select usua_nombre as Usuario, serv_nombre as Servicio, date_format(turn_fecha,  '%Y-%m-%d') as Fecha, sum( turn_estado = 1 ) as Atendidos, sum( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos, sum( turn_estado!=0 ) as Total from turno t, servicio s, usuarios u, cajero c where t.serv_codigo = s.serv_codigo and t.caje_codigo = c.caje_codigo and u.usua_codigo = c.usua_codigo and turn_fecha >= '" + fDesde + "' and turn_fecha <= '" + fHasta + "' and u.usua_codigo group by Fecha, Usuario, Servicio order by Fecha DESC, Usuario, Servicio; ";
    }
    else {
        query = "select usua_nombre as Usuario, serv_nombre as Servicio, date_format(turn_fecha,  '%Y-%m-%d') as Fecha, sum( turn_estado = 1 ) as Atendidos, sum( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos, sum( turn_estado!=0 ) as Total from turno t, servicio s, usuarios u, cajero c where t.serv_codigo = s.serv_codigo and t.caje_codigo = c.caje_codigo and u.usua_codigo = c.usua_codigo, and u.empr_codigo = '" + cEmpresa + "' and turn_fecha >= '" + fDesde + "' and turn_fecha <= '" + fHasta + "' and u.usua_codigo group by Fecha, Usuario, Servicio order by Fecha DESC, Usuario, Servicio; ";
    }
    const fecha = anio1 + '-' + mes1 + '-' + dia1;
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
router.get('/tiempopromedioatencion/:fechaDesde/:fechaHasta/:cajero', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cajero;
    const query = " select serv_nombre as Servicio, caje_nombre as Nombre, count(turn_codigo) as Turnos, date_format(sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))), '%H:%i:%s') as Promedio    from cajero c, turno t, servicio s      where t.caje_codigo = c.caje_codigo and    t.serv_codigo = s.serv_codigo and    t.turn_fecha  and t.turn_fecha  and   t.turn_fecha >= '" + fDesde + "' and t.turn_fecha <= '" + fHasta + "' and  c.caje_codigo = " + cCajero + " group by Nombre, Servicio   ";
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
