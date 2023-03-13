"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = express_1.Router();
///////////////////
//ATENDIDOS MULTIPLES
//////////////////
router.get('/atendidosmultiples/:fechaDesde/:fechaHasta', (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const query = "select usua_nombre as Usuario, count(eval_codigo) as Atendidos" +
        " from usuarios u, evaluacion e, turno t" +
        " where u.usua_codigo = e.usua_codigo" +
        " and t.turn_codigo = e.turn_codigo" +
        " and u.usua_codigo" +
        " and t.turn_fecha >= '" + fDesde + "'" +
        " and t.turn_fecha <= '" + fHasta + "'" +
        " group by usua_nombre;";
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
