"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaToken = void 0;
let jwt = require('jsonwebtoken');
//==================
//VERIFICAR TOKEN
//==================
let verificaToken = (req, res, next) => {
    // NOMBRE DE HEADERS
    let token = req.get('token'); //authorization
    jwt.verify(token, 'peter', (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err: 'Token no valido'
            });
        }
        next(); // SIRVE PARA QUE CONTINUE CON LA EJECUCION DEL PROGRAMA
    });
};
exports.verificaToken = verificaToken;
