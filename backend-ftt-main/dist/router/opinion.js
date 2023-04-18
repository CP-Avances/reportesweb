"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const router = (0, express_1.Router)();
/** ************************************************************************************************************ **
 ** **                                             OPINIONES                                                  ** **
 ** ************************************************************************************************************ **/
router.get("/opinion/:fechaDesde/:fechaHasta/:sucursales/:tipos", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaTipos = req.params.tipos;
    const tiposArray = listaTipos.split(",");
    let todasSucursales = false;
    let todasTipos = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (tiposArray.includes("-1")) {
        todasTipos = true;
    }
    const query = `
        SELECT quejas.emi_codigo AS quejas_emi_codigo, 
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo', 
          IF((quejas.emi_tipo = 3), 'Sugerencia', 
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo, 
          quejas.emi_categoria AS quejas_emi_categoria, 
          CAST(STR_TO_DATE(concat(quejas.emi_fecha," ",quejas.emi_hora,":",quejas.emi_minuto,":00"),'%Y-%m-%d %H:%i:%s') AS CHAR) AS quejas_emi_fecha,  
          empresa.empr_nombre AS empresa_empr_nombre, 
          quejas.caja_codigo AS caja_caja_nombre, 
          quejas.emi_queja AS quejas_emi_queja 
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo 
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ${!todasSucursales ? `AND empresa.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasTipos ? `AND quejas.emi_tipo IN (${listaTipos})` : ''}
        ORDER BY quejas.emi_fecha DESC, quejas.emi_hora DESC, quejas.emi_minuto DESC, quejas.emi_codigo DESC;
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
 ** **                                       GRAFICO OPINION                                                  ** **
 ** ************************************************************************************************************ **/
router.get("/graficoopinion/:fechaDesde/:fechaHasta/:sucursales", (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    const query = `
        SELECT COUNT(quejas.emi_tipo) AS queja_cantidad,
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo',
          IF((quejas.emi_tipo = 3), 'Sugerencia',
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo,
        empresa.empr_nombre AS empresa_empr_nombre
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND empresa.empr_codigo IN (${listaSucursales})` : ''}
        GROUP BY emi_tipo, empresa.empr_nombre;
        `;
    console.log(query);
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
