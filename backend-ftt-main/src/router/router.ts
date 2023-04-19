import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path'
let jwt = require('jsonwebtoken');
const router = Router();

const ImagenBase64LogosEmpresas = function (path_file: string) {
    try {
        path_file = path.resolve('uploads') + '/' + path_file
        let data = fs.readFileSync(path_file);

        return data.toString('base64');
    } catch (error) {
        return 0
    }
}

//rutas prueba
router.get('/heroes', (req: Request, res: Response) => {
    res.json({
        ok: true,
        mensaje: 'todo esta bien'
    })
});

router.get('/heroes/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    res.json({
        ok: true,
        mensaje: 'todo esta bien',
        id: id
    })
});


//querys
router.get('/usuarios', cors(), (req: Request, res: Response) => {

    const query =
        `
        SELECT * FROM usuarios
        `
    MySQL.ejecutarQuery(query, (err: any, usuarios: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        } else {
            res.json({
                ok: true,
                usuarios: usuarios
            })
        }
    })
});

router.get('/usuario/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    const usua_codigo = id;
    const escapeId = MySQL.instance.cnn.escape(id);
    const query =
        `
        SELECT * FROM usuarios WHERE usua_codigo = ${escapeId}
        `
    MySQL.ejecutarQuery(query, (err: any, usuario: Object[]) => {

        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        } else {
            res.json({
                ok: true,
                usuario: usuario[0]
            })
        }
    })
});


//////getuser
router.get('/username/:usua_login', (req: Request, res: Response) => {

    const username = req.params.usua_login;
    const escapeUsername = MySQL.instance.cnn.escape(username);
    const query =
        `
        SELECT * FROM usuarios where usua_login = ${escapeUsername}
        `
    MySQL.ejecutarQuery(query, (err: any, usuario: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        } else {
            res.json({
                ok: true,
                usuario: usuario[0]
            })
        }
    })
});

router.post('/login/:usua_login/:usua_password', (req: Request, res: Response) => {

    const username = req.params.usua_login;
    const pass = req.params.usua_password;
    const query =
        `
        SELECT 1 FROM usuarios WHERE usua_login = '${username}' AND usua_password=MD5('${pass}') 
        AND usua_tipo = 1
        `
    MySQL.ejecutarQuery(query, (err: any, usuario: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });

        } else {
            let token = jwt.sign({ data: usuario[0] }, 'peter', { expiresIn: 60 * 60 });
            res.json({
                ok: true,
                token
                //usuario: usuario[0], token
            })
        }
    })
});

router.get('/renew', (req: Request, res: Response) => {
    res.json({
        ok: true,
        mensaje: 'todo esta bien'
    })
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage });

// GUARDAR NOMBRE IMAGEN EN LA BASE DE DATOS
router.post('/uploadImage', upload.single('image'), (req, res) => {

    const filename = req.file?.path.split("\\")[1];

    // BUSQUEDA DE LOGO
    const logo =
        `
        SELECT gene_valor FROM general WHERE gene_codigo = 8;
        `
        ;

    let nombreImagen: any[];

    MySQL.ejecutarQuery(logo, (err: any, imagen: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        } else {
            nombreImagen = imagen;
            if (nombreImagen[0].gene_valor != null && nombreImagen[0].gene_valor != '') {

                if (nombreImagen[0].gene_valor === filename) {
                    ActualizarImagen(res, filename);
                }
                else {
                    let path_file = path.resolve('uploads') + '/' + nombreImagen[0].gene_valor
                    // ELIMINAR REGISTRO DEL SERVIDOR
                    fs.unlinkSync(path_file);
                    ActualizarImagen(res, filename);
                }
            }
            else {
                ActualizarImagen(res, filename);
            }
        }
    });
}
);

function ActualizarImagen(res: any, archivo: any) {
    const query = `UPDATE general SET gene_valor = '${archivo}' WHERE gene_codigo = 8;`
    MySQL.ejecutarQuery(query, (err: any, usuario: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });

        } else {
            res.json({
                ok: true,
                //usuario: usuario[0], token
            })
        }
    })
}

router.get('/nombreImagen', (req: Request, res: Response) => {
    const query = `
      SELECT gene_valor FROM general WHERE gene_codigo = 8;
      `;

    ;

    let nombreImagen: any[];

    MySQL.ejecutarQuery(query, (err: any, imagen: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        } else {
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
router.get('/setMeta/:valor', (req, res) => {
    const valor = req.params.valor;

    const query = `UPDATE general SET gene_valor = '${valor}' WHERE gene_codigo = 9;`

    MySQL.ejecutarQuery(query, (err: any, usuario: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });

        } else {
            res.json({
                ok: true,
            })
        }
    })
}
);

router.get('/getMeta', (req: Request, res: Response) => {
    const query = `
      SELECT gene_valor FROM general WHERE gene_codigo = 9;
      `;

    MySQL.ejecutarQuery(query, (err: any, valor: any) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        } else {
            res.json({
                ok: true,
                valor: valor[0].gene_valor,
            });
        }
    });
});

export default router;
