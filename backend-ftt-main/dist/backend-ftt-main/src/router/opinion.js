"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
///////////////////
//OPINIONES
//////////////////
router.get("/opinion/:fechaDesde/:fechaHasta", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "SELECT quejas.`emi_codigo` AS quejas_emi_codigo, " +
        "IF((quejas.emi_tipo=1),'Queja',IF((quejas.emi_tipo=2),'Reclamo', " +
        "IF((quejas.emi_tipo=3),'Sugerencia',IF((quejas.emi_tipo=4),'Felicitaciones','No Existe')))) AS quejas_emi_tipo, " +
        "quejas.`emi_categoria` AS quejas_emi_categoria, " +
        "date_format(quejas.`emi_fecha`,  '%Y-%m-%d') AS quejas_emi_fecha, " +
        "quejas.`emi_hora` AS quejas_emi_hora, " +
        "quejas.`emi_minuto` AS quejas_emi_minuto, " +
        "empresa.`empr_nombre` AS empresa_empr_nombre, " +
        "caja.`caja_nombre` AS caja_caja_nombre, " +
        "quejas.`emi_queja` AS quejas_emi_queja " +
        "FROM`empresa` empresa INNER JOIN `quejas` quejas ON empresa.`empr_codigo` = quejas.`empr_codigo` " +
        "INNER JOIN `caja` caja ON quejas.`caja_codigo` = caja.`caja_codigo` " +
        "WHERE emi_fecha BETWEEN '" +
        fDesde +
        "' AND '" +
        fHasta +
        "' " +
        "ORDER BY quejas.`emi_fecha` DESC, quejas.`emi_hora` DESC, quejas.`emi_minuto` DESC, quejas.`emi_codigo` DESC;";
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
//////////////////////////
//GRAFICO OPINION
/////////////////////////
router.get("/graficoopinion/:fechaDesde/:fechaHasta", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "SELECT COUNT(quejas.emi_tipo) AS queja_cantidad, " +
        "IF((quejas.emi_tipo=1),'Queja',IF((quejas.emi_tipo=2), " +
        "'Reclamo',IF((quejas.emi_tipo=3),'Sugerencia',IF((quejas.emi_tipo=4),'Felicitaciones','No Existe')))) AS quejas_emi_tipo, " +
        "empresa.`empr_nombre` AS empresa_empr_nombre, " +
        "quejas.`emi_categoria` AS quejas_emi_categoria " +
        "FROM " +
        "`empresa` empresa INNER JOIN `quejas` quejas ON empresa.`empr_codigo` = quejas.`empr_codigo` " +
        "WHERE " +
        "emi_fecha BETWEEN '" +
        fDesde +
        "' AND '" +
        fHasta +
        "' " +
        "GROUP BY " +
        "emi_tipo";
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
