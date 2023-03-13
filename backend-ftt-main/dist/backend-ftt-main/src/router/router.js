"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const cors_1 = __importDefault(require("cors"));
//
let jwt = require('jsonwebtoken');
const router = express_1.Router();
//rutas prueba
router.get('/heroes', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'todo esta bien'
    });
});
router.get('/heroes/:id', (req, res) => {
    const id = req.params.id;
    res.json({
        ok: true,
        mensaje: 'todo esta bien',
        id: id
    });
});
//////////////
//querys
router.get('/usuarios', cors_1.default(), (req, res) => {
    const query = `
    SELECT * 
    FROM usuarios`;
    mysql_1.default.ejecutarQuery(query, (err, usuarios) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                usuarios: usuarios
            });
        }
    });
});
router.get('/usuario/:id', (req, res) => {
    const id = req.params.id;
    const usua_codigo = id;
    const escapeId = mysql_1.default.instance.cnn.escape(id);
    const query = `
    SELECT *
    FROM usuarios
    where usua_codigo = ${escapeId}`;
    mysql_1.default.ejecutarQuery(query, (err, usuario) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                usuario: usuario[0]
            });
        }
    });
});
//////getuser
router.get('/username/:usua_login', (req, res) => {
    const username = req.params.usua_login;
    const escapeUsername = mysql_1.default.instance.cnn.escape(username);
    const query = `
    SELECT * FROM usuarios where usua_login = ${escapeUsername}`;
    mysql_1.default.ejecutarQuery(query, (err, usuario) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            res.json({
                ok: true,
                usuario: usuario[0]
            });
        }
    });
});
router.post('/login/:usua_login/:usua_password', (req, res) => {
    const username = req.params.usua_login;
    const pass = req.params.usua_password;
    //console.log(username + "****") esto solo puse para comprobar que si estas obteniendo el usuario 
    //const escapeUsername = MySQL.instance.cnn.escape(username);
    const query = "SELECT 1 FROM usuarios where usua_login = '" + username + "' and usua_password=MD5('" + pass + "')";
    //var sql="SELECT id, first_name, last_name, user_name FROM `users` WHERE `user_name`='"+name+"' and password = '"+pass+"'";"
    mysql_1.default.ejecutarQuery(query, (err, usuario) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        }
        else {
            let token = jwt.sign({ data: usuario[0] }, 'peter', { expiresIn: 60 * 60 });
            res.json({
                ok: true,
                token
                //usuario: usuario[0], token
            });
        }
    });
    //  res.json({
    //      ok: true,
    //      mensaje: 'HOLA LOGIN'
    //  })
});
router.get('/renew', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'todo esta bien'
    });
});
exports.default = router;
