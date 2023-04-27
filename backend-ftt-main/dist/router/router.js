"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verifivarToken_1 = require("../libs/verifivarToken");
const express_1 = require("express");
const mysql_1 = __importDefault(require("../mysql/mysql"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
let jwt = require('jsonwebtoken');
const router = (0, express_1.Router)();
const ObtenerRuta = function () {
    var ruta = '';
    for (var i = 0; i < __dirname.split('\\').length - 2; i++) {
        if (ruta === '') {
            ruta = __dirname.split('\\')[i];
        }
        else {
            ruta = ruta + "\\" + __dirname.split('\\')[i];
        }
    }
    return ruta + '\\imagenesReportes';
};
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, ObtenerRuta());
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage: storage });
// GUARDAR NOMBRE IMAGEN EN LA BASE DE DATOS
router.post('/uploadImage', verifivarToken_1.TokenValidation, upload.single('image'), (req, res) => {
    var _a;
    const filename = (_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname;
    // BUSQUEDA DE LOGO
    const logo = `
        SELECT gene_valor FROM general WHERE gene_codigo = 8;
        `;
    let nombreImagen;
    mysql_1.default.ejecutarQuery(logo, (err, imagen) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            nombreImagen = imagen;
            if (nombreImagen[0].gene_valor != null && nombreImagen[0].gene_valor != '') {
                if (nombreImagen[0].gene_valor === filename) {
                    ActualizarImagen(res, filename);
                }
                else {
                    var direccion = ObtenerRuta() + '\\' + nombreImagen[0].gene_valor;
                    // ELIMINAR REGISTRO DEL SERVIDOR
                    fs_1.default.unlinkSync(direccion);
                    ActualizarImagen(res, filename);
                }
            }
            else {
                ActualizarImagen(res, filename);
            }
        }
    });
});
const ImagenBase64LogosEmpresas = function (path_file) {
    try {
        var ruta = ObtenerRuta() + '\\' + path_file;
        let data = fs_1.default.readFileSync(ruta);
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
router.get('/usuarios', verifivarToken_1.TokenValidation, (0, cors_1.default)(), (req, res) => {
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
router.get('/usuario/:id', verifivarToken_1.TokenValidation, (req, res) => {
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
router.get('/username/:usua_login', verifivarToken_1.TokenValidation, (req, res) => {
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
            let token = jwt.sign({ data: usuario[0] }, 'llaveSecreta', { expiresIn: 60 * 60 * 23 });
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
function ActualizarImagen(res, archivo) {
    const query = `UPDATE general SET gene_valor = '${archivo}' WHERE gene_codigo = 8;`;
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
}
router.get('/nombreImagen', verifivarToken_1.TokenValidation, (req, res) => {
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
//Guardar meta de turnos en la base de datos
router.get('/setMeta/:valor', verifivarToken_1.TokenValidation, (req, res) => {
    const valor = req.params.valor;
    const query = `UPDATE general SET gene_valor = '${valor}' WHERE gene_codigo = 9;`;
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
            });
        }
    });
});
router.get('/getMeta', verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
      SELECT gene_valor FROM general WHERE gene_codigo = 9;
      `;
    mysql_1.default.ejecutarQuery(query, (err, valor) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                valor: valor[0].gene_valor,
            });
        }
    });
});
//Guardar marca de agua
router.get('/setMarca/:marca', verifivarToken_1.TokenValidation, (req, res) => {
    const marca = req.params.marca;
    const query = `UPDATE general SET gene_valor = '${marca}' WHERE gene_codigo = 10;`;
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
            });
        }
    });
});
router.get('/getMarca', verifivarToken_1.TokenValidation, (req, res) => {
    const query = `
      SELECT gene_valor FROM general WHERE gene_codigo = 10;
      `;
    mysql_1.default.ejecutarQuery(query, (err, marca) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        }
        else {
            res.json({
                ok: true,
                marca: marca[0].gene_valor,
            });
        }
    });
});
exports.default = router;
