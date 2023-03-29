"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let jwt = require('jsonwebtoken');
const router = (0, express_1.Router)();
const ImagenBase64LogosEmpresas = function (path_file) {
    try {
        path_file = path_1.default.resolve('uploads') + '/' + path_file;
        let data = fs_1.default.readFileSync(path_file);
        return data.toString('base64');
    }
    catch (error) {
        return 0;
    }
};
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
//querys
router.get('/usuarios', (0, cors_1.default)(), (req, res) => {
    const query = `
        SELECT * FROM usuarios
        `;
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
        SELECT * FROM usuarios WHERE usua_codigo = ${escapeId}
        `;
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
        SELECT * FROM usuarios where usua_login = ${escapeUsername}
        `;
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
    const query = `
        SELECT 1 FROM usuarios WHERE usua_login = '${username}' AND usua_password=MD5('${pass}') 
        AND usua_tipo = 1
        `;
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
});
router.get('/renew', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'todo esta bien'
    });
});
const upload = (0, multer_1.default)({ dest: 'uploads/' });
//Guardar nombre imagen en la base de datos
router.post('/uploadImage', upload.single('image'), (req, res) => {
    var _a;
    const filename = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path.split("\\")[1];
    // const list: any = req.file;
    // let logo = list.file.path.split("\\")[1];// const ruta = req.params.ruta;
    const query = `UPDATE general SET gene_valor = '${filename}' WHERE gene_codigo = 8;`;
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
                //usuario: usuario[0], token
            });
        }
    });
});
router.get('/nombreImagen', (req, res) => {
    const query = `
      SELECT gene_valor FROM general WHERE gene_codigo = 8;
      `;
    ;
    let nombreImagen;
    mysql_1.default.ejecutarQuery(query, (err, imagen) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            nombreImagen = imagen;
            const codificado = ImagenBase64LogosEmpresas(nombreImagen[0].gene_valor);
            res.json({
                ok: true,
                imagen: codificado,
            });
        }
    });
});
exports.default = router;
