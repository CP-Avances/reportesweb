import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';
import cors from 'cors';
let jwt = require('jsonwebtoken');
const router = Router();

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
        SELECT 1 FROM usuarios where usua_login = '${username}' and usua_password=MD5('${pass}')
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

export default router;

