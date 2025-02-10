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
 ** **                                               MENU                                                      ** **
 ** ************************************************************************************************************* **/
router.get("/identificacionCliente", verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
        SELECT gene_valor FROM general WHERE gene_codigo = 11;
        `;
    mysql_1.default.ejecutarQuery(query, (err, identificacion) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                valor: identificacion,
            });
        }
    });
});
exports.default = router;
