"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verifivarToken_1 = require("../libs/verifivarToken");
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************* **
 ** **                                        ATENDIDOS MULTIPLES                                              ** **
 ** ************************************************************************************************************* **/
router.get('/atendidosmultiples/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
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
            SELECT em.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario, count(eval_codigo) AS Atendidos
            FROM usuarios u, evaluacion e, turno t, empresa em
            WHERE u.usua_codigo = e.usua_codigo
                AND t.turn_codigo = e.turn_codigo
                AND u.empr_codigo = em.empr_codigo
                AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                AND u.usua_codigo != 2
                ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
                ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
            GROUP BY usua_nombre, nombreEmpresa;
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
