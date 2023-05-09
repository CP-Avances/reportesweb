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
 ** **                                             OPINIONES                                                  ** **
 ** ************************************************************************************************************ **/
router.get("/opinion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:tipos", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaTipos = req.params.tipos;
    const tiposArray = listaTipos.split(",");
    let todasSucursales = false;
    let todasTipos = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (tiposArray.includes("-1")) {
        todasTipos = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    const query = `
        SELECT quejas.emi_codigo AS quejas_emi_codigo, 
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo', 
          IF((quejas.emi_tipo = 3), 'Sugerencia', 
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo, 
          quejas.emi_categoria AS quejas_emi_categoria, 
          CAST(STR_TO_DATE(quejas.emi_fecha,'%Y-%m-%d') AS CHAR) AS quejas_emi_fecha, 
          CAST(CONCAT(LPAD(quejas.emi_hora, 2, '0'), ':', LPAD(quejas.emi_minuto, 2, '0')) AS CHAR) AS hora, 
          empresa.empr_nombre AS empresa_empr_nombre, 
          quejas.caja_codigo AS caja_caja_nombre, 
          quejas.emi_queja AS quejas_emi_queja 
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo 
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ${!todasSucursales ? `AND empresa.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasTipos ? `AND quejas.emi_tipo IN (${listaTipos})` : ''}
        ${!diaCompleto ? `AND quejas.emi_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        ORDER BY quejas.emi_fecha DESC, hora DESC;
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
router.get("/opinionIC/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:tipos/:categorias", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaTipos = req.params.tipos;
    const tiposArray = listaTipos.split(",");
    const listaCategorias = req.params.categorias;
    const categoriasArray = listaCategorias.split(",");
    let todasSucursales = false;
    let todasTipos = false;
    let todasCategorias = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (tiposArray.includes("-1")) {
        todasTipos = true;
    }
    if (categoriasArray.includes("-1")) {
        todasCategorias = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    let resultado = '';
    if (!todasCategorias) {
        const listaCategoriasConComillas = categoriasArray.map(categoria => `'${categoria}'`);
        resultado = listaCategoriasConComillas.join(', ');
    }
    const query = `
        SELECT quejas.emi_codigo AS quejas_emi_codigo, 
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo', 'No Existe')) AS quejas_emi_tipo, 
          quejas.emi_categoria AS quejas_emi_categoria, 
          CAST(STR_TO_DATE(quejas.emi_fecha,'%Y-%m-%d') AS CHAR) AS quejas_emi_fecha, 
          CAST(CONCAT(LPAD(quejas.emi_hora, 2, '0'), ':', LPAD(quejas.emi_minuto, 2, '0')) AS CHAR) AS hora, 
          empresa.empr_nombre AS empresa_empr_nombre, 
          quejas.caja_codigo AS caja_caja_nombre, 
          quejas.emi_queja AS quejas_emi_queja 
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo 
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        AND (quejas.emi_tipo = 1 OR quejas.emi_tipo = 2)
        ${!todasSucursales ? `AND empresa.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasTipos ? `AND quejas.emi_tipo IN (${listaTipos})` : ''}
        ${!todasCategorias ? `AND quejas.emi_categoria IN (${resultado})` : ''}
        ${!diaCompleto ? `AND quejas.emi_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        ORDER BY quejas.emi_fecha DESC, hora DESC;
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
router.get("/graficoopinion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales", verifivarToken_1.TokenValidation, (req, res) => {
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
        ${!diaCompleto ? `AND quejas.emi_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY emi_tipo, empresa.empr_nombre;
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
router.get("/graficoopinionIC/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:tipos", verifivarToken_1.TokenValidation, (req, res) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaTipos = req.params.tipos;
    const tiposArray = listaTipos.split(",");
    let todasSucursales = false;
    let todasTipos = false;
    let diaCompleto = false;
    let hFinAux = 0;
    if (sucursalesArray.includes("-1")) {
        todasSucursales = true;
    }
    if (tiposArray.includes("-1")) {
        todasTipos = true;
    }
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    else {
        hFinAux = parseInt(hFin) - 1;
    }
    const query = `
        SELECT COUNT(quejas.emi_categoria) AS queja_cantidad,
        IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo',
          IF((quejas.emi_tipo = 3), 'Sugerencia',
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo,
        quejas.emi_categoria AS quejas_emi_categoria,
        empresa.empr_nombre AS empresa_empr_nombre
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND empresa.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasTipos ? `AND quejas.emi_tipo IN (${listaTipos})` : ''}
        ${!diaCompleto ? `AND quejas.emi_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY quejas.emi_categoria, empresa.empr_nombre;
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
//Obtener categorias
router.get("/categorias/:tipo", verifivarToken_1.TokenValidation, (req, res) => {
    const tipo = req.params.tipo;
    const query = `
  SELECT DISTINCT emi_categoria FROM quejas WHERE emi_tipo = ${tipo} ORDER BY emi_categoria ASC;
    `;
    mysql_1.default.ejecutarQuery(query, (err, categoria) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                categoria: categoria,
            });
        }
    });
});
exports.default = router;
