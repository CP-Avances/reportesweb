"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificaToken = void 0;
let jwt = require('jsonwebtoken');
//==================
//VERIFICAR TOKEN
//==================
let verificaToken = (req, res, next) => {
    //nombre de headers
    let token = req.get('token'); //authorization
    jwt.verify(token, 'peter', (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err: 'Token no valido'
            });
        }
        //req.usuarios[0] = decoded.usuario;
        next(); //srive para que continue con la ejecucion del programa
    });
};
exports.verificaToken = verificaToken;
