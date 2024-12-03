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
 ** **                                      INGRESO DE CLIENTES                                               ** **
 ** ************************************************************************************************************ **/
router.get('/ingresoclientes/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales', verifivarToken_1.TokenValidation, (req, res) => {
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
                    DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
                    COUNT(turn_codigo) AS clientes,
                    MAX(turn_fecha) AS fechamaxima,  -- Fecha máxima dentro del rango
                    MIN(turn_fecha) AS fechaminima  -- Fecha mínima dentro del rango
                FROM 
                    turno t
                INNER JOIN 
                    servicio s ON t.serv_codigo = s.serv_codigo
                INNER JOIN 
                    empresa e ON s.empr_codigo = e.empr_codigo
                INNER JOIN 
                    sub_servicio ss ON t.id_sub_serv = ss.id
                WHERE 
                    t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'  
                    AND t.caje_codigo != 0  
                    ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}  
                    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}'` : ''}  
                GROUP BY 
                    e.empr_nombre, Fecha  
                ORDER BY 
                    Fecha DESC;  
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
router.get('/ingresoclientesmenu/:fecha', verifivarToken_1.TokenValidation, (req, res) => {
    let fechas = req.params.fecha;
    const query = `
            SELECT 
                turn_fecha,
                COUNT(turn_codigo) AS clientes, 
                (SELECT MAX(turn_fecha) FROM turno WHERE TURN_FECHA = ${fechas}) AS fechamaxima, 
                (SELECT MIN(turn_fecha) FROM turno WHERE TURN_FECHA = ${fechas}) AS fechaminima
            FROM 
                turno
            INNER JOIN 
                servicio s ON turno.serv_codigo = s.serv_codigo
            INNER JOIN 
                sub_servicio ss ON turno.id_sub_serv = ss.id
            WHERE 
                turno.TURN_FECHA = '${fechas}'
            GROUP BY 
                turn_fecha;
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
