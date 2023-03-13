"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
/////////////////
//SERVICIO
////////////////
router.get("/promedios/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT a.usua_nombre as Usuario, date_format(f.eval_fecha, '%Y-%m-%d') as Fecha, sum(eval_califica=50) as Excelente,sum(eval_califica=40) as Muy_Bueno,sum(eval_califica=30) as Bueno,sum(eval_califica=20) as Regular,sum(eval_califica=10) as Malo,count(eval_califica) as Total,IF(AVG(eval_califica)>=42,'Excelente',IF(AVG(eval_califica)>=34,'Muy Bueno',IF(AVG(eval_califica)>=26,'Bueno',IF(AVG(eval_califica)>=18,'Regular',IF(AVG(eval_califica)>=10,'Malo','No existe'))))) AS Promedio from  usuarios a, evaluacion f, empresa e, turno t, servicio s WHERE a.usua_codigo=f.usua_codigo and e.empr_codigo=a.empr_codigo and s.serv_codigo = t.serv_codigo and f.eval_fecha >= '" +
        fDesde +
        "' and f.eval_fecha <= '" +
        fHasta +
        "' and f.turn_codigo = t.turn_codigo and s.serv_codigo = " +
        cCajero +
        " and e.empr_codigo group by  f.eval_fecha, f.usua_codigo;";
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
    select * from servicio order by serv_nombre;
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
router.get("/maximosminimos/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT a.usua_nombre as Usuario, date_format(f.eval_fecha, '%Y-%m-%d') as Fecha," +
        " sum(eval_califica=50) as Excelente," +
        " sum(eval_califica=40) as Muy_Bueno," +
        " sum(eval_califica=30) as Bueno," +
        " sum(eval_califica=20) as Regular," +
        " sum(eval_califica=10) as Malo," +
        " count(eval_califica) as Total," +
        " if(sum(eval_califica=50) >= sum(eval_califica=40)" +
        " and sum(eval_califica=50) >= sum(eval_califica=30)" +
        " and sum(eval_califica=50) >= sum(eval_califica=20)" +
        " and sum(eval_califica=50) >= sum(eval_califica=10),concat(cast(sum(eval_califica=50) as char),' (E)' )," +
        " if(sum(eval_califica=40) >= sum(eval_califica=30)" +
        " and sum(eval_califica=40) >= sum(eval_califica=20)" +
        " and sum(eval_califica=40) >= sum(eval_califica=10),concat(cast(sum(eval_califica=40)as char),' (MB)' )," +
        " if(sum(eval_califica=30) >= sum(eval_califica=20)" +
        " and sum(eval_califica=30) >= sum(eval_califica=10),concat(cast(sum(eval_califica=30)as char),' (B)' )," +
        " if(sum(eval_califica=20)>= sum(eval_califica=10),concat(cast(sum(eval_califica=20)as char),' (R)' ),concat(cast(sum(eval_califica =10)as char),' (M)' ))))) AS max," +
        " if(sum(eval_califica=50) < sum(eval_califica=40)" +
        " and sum(eval_califica=50) < sum(eval_califica=30)" +
        " and sum(eval_califica=50) < sum(eval_califica=20)" +
        " and sum(eval_califica=50) < sum(eval_califica=10),concat(cast(sum(eval_califica=50) as char),' (E)' ) ," +
        " if(sum(eval_califica=40) < sum(eval_califica=30)" +
        " and sum(eval_califica=40) < sum(eval_califica=20)" +
        " and sum(eval_califica=40) < sum(eval_califica=10),concat(cast(sum(eval_califica=40) as char),' (MB)' )," +
        " if(sum(eval_califica=30) < sum(eval_califica=20)" +
        " and sum(eval_califica=30) < sum(eval_califica=10),  concat(cast(sum(eval_califica=30) as char),' (B)' )," +
        " if(sum(eval_califica=20)< sum(eval_califica=10),concat(cast(sum(eval_califica=20) as char),' (R)' ),concat(cast(sum(eval_califica=10) as char),' (M)' ))))) AS min" +
        " from  usuarios a, evaluacion f ,empresa e, turno t, servicio s" +
        " WHERE " +
        " a.usua_codigo=f.usua_codigo and e.empr_codigo=a.empr_codigo and s.serv_codigo = t.serv_codigo" +
        " and eval_fecha >= '" +
        fDesde +
        "'" +
        " and eval_fecha <= '" +
        fHasta +
        "'" +
        " and f.turn_codigo = t.turn_codigo " +
        " and s.serv_codigo = " +
        cCajero +
        " and e.empr_codigo" +
        " group by  f.eval_fecha, f.usua_codigo;";
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
/////////////////
//EMPLEADO
////////////////
router.get("/promediose/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT a.usua_nombre,  date_format(f.eval_fecha, '%Y-%m-%d') as fecha," +
        " sum(eval_califica=50) as Excelente," +
        " sum(eval_califica=40) as Muy_Bueno," +
        " sum(eval_califica=30) as Bueno," +
        " sum(eval_califica=20) as Regular," +
        " sum(eval_califica=10) as Malo," +
        " count(eval_califica) as Total," +
        " IF(AVG(eval_califica)>=42,'Excelente'," +
        " IF(AVG(eval_califica)>=34,'Muy Bueno'," +
        " IF(AVG(eval_califica)>=26,'Bueno'," +
        " IF(AVG(eval_califica)>=18,'Regular'," +
        " IF(AVG(eval_califica)>=10,'Malo','No existe'))))) AS Promedio" +
        " from  usuarios a, evaluacion f ,empresa e, cajero c" +
        " WHERE" +
        " a.usua_codigo=f.usua_codigo and e.empr_codigo=a.empr_codigo" +
        " and a.usua_codigo = c.usua_codigo" +
        " and f.eval_fecha >= '" +
        fDesde +
        "'" +
        " and f.eval_fecha <= '" +
        fHasta +
        "'" +
        " and c.caje_codigo = " +
        cCajero +
        " and e.empr_codigo" +
        " group by  f.eval_fecha, f.usua_codigo;";
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
router.get("/omitidas/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT a.usua_nombre,  date_format(f.eval_fecha, '%Y-%m-%d') as fecha," +
        " count(eval_califica) as Total" +
        " from  usuarios a, noevaluacion f ,empresa e, cajero c" +
        " WHERE" +
        " a.usua_codigo=f.usua_codigo and e.empr_codigo=a.empr_codigo" +
        " and a.usua_codigo = c.usua_codigo" +
        " and f.eval_fecha >= '" +
        fDesde +
        "'" +
        " and f.eval_fecha <= '" +
        fHasta +
        "'" +
        " and c.caje_codigo = " +
        cCajero +
        " and e.empr_codigo" +
        " group by  f.eval_fecha, f.usua_codigo;";
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
router.get("/maximosminimose/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT a.usua_nombre,  date_format(f.eval_fecha, '%Y-%m-%d') as fecha," +
        " sum(eval_califica=50) as Excelente," +
        " sum(eval_califica=40) as Muy_Bueno," +
        " sum(eval_califica=30) as Bueno," +
        " sum(eval_califica=20) as Regular," +
        " sum(eval_califica=10) as Malo," +
        " count(eval_califica) as Total," +
        " if(sum(eval_califica=50) >= sum(eval_califica=40)" +
        " and sum(eval_califica=50) >= sum(eval_califica=30)" +
        " and sum(eval_califica=50) >= sum(eval_califica=20)" +
        " and sum(eval_califica=50) >= sum(eval_califica=10),concat(cast(sum(eval_califica=50) as char),' (E)' )," +
        " if(sum(eval_califica=40) >= sum(eval_califica=30)" +
        " and sum(eval_califica=40) >= sum(eval_califica=20)" +
        " and sum(eval_califica=40) >= sum(eval_califica=10),concat(cast(sum(eval_califica=40)as char),' (MB)' )," +
        " if(sum(eval_califica=30) >= sum(eval_califica=20)" +
        " and sum(eval_califica=30) >= sum(eval_califica=10),concat(cast(sum(eval_califica=30)as char),' (B)' )," +
        " if(sum(eval_califica=20)>= sum(eval_califica=10),concat(cast(sum(eval_califica=20)as char),' (R)' ),concat(cast(sum(eval_califica =10)as char),' (M)' ))))) AS max," +
        " if(sum(eval_califica=50) < sum(eval_califica=40)" +
        " and sum(eval_califica=50) < sum(eval_califica=30)" +
        " and sum(eval_califica=50) < sum(eval_califica=20)" +
        " and sum(eval_califica=50) < sum(eval_califica=10),concat(cast(sum(eval_califica=50) as char),' (E)' ) ," +
        " if(sum(eval_califica=40) < sum(eval_califica=30)" +
        " and sum(eval_califica=40) < sum(eval_califica=20)" +
        " and sum(eval_califica=40) < sum(eval_califica=10),concat(cast(sum(eval_califica=40) as char),' (MB)' )," +
        " if(sum(eval_califica=30) < sum(eval_califica=20)" +
        " and sum(eval_califica=30) < sum(eval_califica=10),  concat(cast(sum(eval_califica=30) as char),' (B)' )," +
        " if(sum(eval_califica=20)< sum(eval_califica=10),concat(cast(sum(eval_califica=20) as char),' (R)' ),concat(cast(sum(eval_califica=10) as char),' (M)' ))))) AS min" +
        " from  usuarios a, evaluacion f ,empresa e, cajero c" +
        " WHERE" +
        " a.usua_codigo=f.usua_codigo and e.empr_codigo=a.empr_codigo" +
        " and a.usua_codigo = c.usua_codigo" +
        " and eval_fecha >= '" +
        fDesde +
        "'" +
        " and eval_fecha <= '" +
        fHasta +
        "'" +
        " and c.caje_codigo = " +
        cCajero +
        " and e.empr_codigo" +
        " group by  f.eval_fecha, f.usua_codigo;";
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
/////////////////
//GRAFICOS
////////////////
router.get("/graficobarras", (req, res) => {
    const query = `

    SELECT  eval_califica, count(eval_califica) as total, usua_nombre as usuario,
                    if((eval_califica)=50,'Excelente',
                    if((eval_califica)>=40,'Muy Bueno',
                    if((eval_califica)>=30,'Bueno',
                    if((eval_califica)>=20,'Regular',
                    if((eval_califica)>=10,'Malo','No existe'))))) as evaluacion,
					round((count(eval_califica)*100)/(select sum(c) from (select count(eval_califica) as c 
                    from evaluacion, usuarios WHERE
                    evaluacion.usua_codigo = usuarios.usua_codigo and
                    eval_fecha and 
                    eval_fecha and
                    eval_hora and
                    eval_hora
                    group by eval_califica)as tl),2) as porcentaje
                    from evaluacion, usuarios where
                    evaluacion.usua_codigo = usuarios.usua_codigo and
                    eval_fecha and
                    eval_fecha and
                    eval_hora and
                    eval_hora group by eval_califica order by eval_califica DESC;

    `;
    //eval_hora group by eval_califica, usua_nombre order by eval_califica DESC;
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
router.get("/graficobarrasfiltro/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT  eval_califica, count(eval_califica) as total, usua_nombre as usuario," +
        " if((eval_califica)=50,'Excelente'," +
        " if((eval_califica)>=40,'Muy Bueno'," +
        " if((eval_califica)>=30,'Bueno'," +
        " if((eval_califica)>=20,'Regular'," +
        " if((eval_califica)>=10,'Malo','No existe'))))) as evaluacion," +
        " round((count(eval_califica)*100)/(select sum(c) from (select count(eval_califica) as c " +
        " from evaluacion, usuarios, cajero" +
        " WHERE" +
        " evaluacion.usua_codigo = usuarios.usua_codigo" +
        " and usuarios.usua_codigo = cajero.usua_codigo" +
        " and eval_fecha >= '" +
        fDesde +
        "'" +
        " and eval_fecha <= '" +
        fHasta +
        "'" +
        " and cajero.caje_codigo = " +
        cCajero +
        " and eval_hora" +
        " and eval_hora" +
        " group by eval_califica)as tl),3) as porcentaje" +
        " from evaluacion, usuarios, cajero where" +
        " evaluacion.usua_codigo = usuarios.usua_codigo" +
        " and usuarios.usua_codigo = cajero.usua_codigo" +
        " and eval_fecha >= '" +
        fDesde +
        "'" +
        " and eval_fecha <= '" +
        fHasta +
        "'" +
        " and cajero.caje_codigo = " +
        cCajero +
        " group by eval_califica, usua_nombre order by eval_califica DESC;";
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
    SELECT u.usua_nombre, e.eval_califica, count(e.eval_califica) as cuenta, 
    if((eval_califica)=50,'Excelente',
    if((eval_califica)=40,'Muy Bueno',
    if((eval_califica)=30,'Bueno',
    if((eval_califica)=20,'Regular',
    if((eval_califica)=10,'Malo','No existe'))))) as Evaluacion,
    round((count(e.eval_califica)*100)/(select sum(c) from (select count(eval_califica) as c
    from evaluacion  where eval_fecha
    and eval_fecha and usua_codigo group by eval_califica)as tl),2) as porcentaje
    from  usuarios u, evaluacion e
    WHERE e.usua_codigo=u.usua_codigo
    and e.eval_fecha and
    e.eval_fecha and e.usua_codigo 
    group by e.eval_califica order by e.eval_califica DESC

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
///////////////////////
//ESTABLECIMIENTO
//////////////////////
router.get("/establecimiento/:fechaDesde/:fechaHasta", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "SELECT  date_format(eval_fecha, '%Y-%m-%d') as fecha," +
        " sum(eval_califica=50) as Excelente," +
        " sum(eval_califica=40) as Muy_Bueno," +
        " sum(eval_califica=30) as Bueno," +
        " sum(eval_califica=20) as Regular," +
        " sum(eval_califica=10) as Malo," +
        " count(eval_califica) as Total," +
        " if(avg(eval_califica)=50,'Excelente'," +
        " if(avg(eval_califica)>=40,'Muy Bueno'," +
        " if(avg(eval_califica)>=30,'Bueno'," +
        " if(avg(eval_califica)>=20,'Regular'," +
        " if(avg(eval_califica)>=10,'Malo','No existe'))))) as Promedio" +
        " from evaluacion e  WHERE" +
        " eval_fecha >= '" +
        fDesde +
        "'" +
        " and eval_fecha <= '" +
        fHasta +
        "'" +
        " and eval_hora" +
        " group by e.eval_fecha;";
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
//////////////////////////////////
//EVALUACION POR GRUPOS
/////////////////////////////////
router.get("/evaluaciongrupos/:fechaDesde/:fechaHasta/:cCajero", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query = "SELECT a.usua_nombre, date_format(f.eval_fecha, '%Y-%m-%d') as fecha," +
        " sum(eval_califica=50)+ sum(eval_califica=40)+sum(eval_califica=30) as Bueno," +
        " sum(eval_califica=20) +sum(eval_califica=10) as Malo," +
        " count(eval_califica) as Total," +
        " if(avg(eval_califica)>=30,'Bueno'," +
        " if(avg(eval_califica)>=10,'Malo','No existe')) as Promedio" +
        " from  usuarios a, evaluacion f ,empresa e, cajero c" +
        " WHERE" +
        " a.usua_codigo=f.usua_codigo and e.empr_codigo=a.empr_codigo" +
        " and a.usua_codigo = c.usua_codigo" +
        " and f.eval_fecha >= '" +
        fDesde +
        "'" +
        " and f.eval_fecha <= '" +
        fHasta +
        "'" +
        " and c.caje_codigo = " +
        cCajero +
        " and eval_hora" +
        " and eval_hora" +
        " group by f.eval_fecha, f.usua_codigo;";
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
