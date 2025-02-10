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
