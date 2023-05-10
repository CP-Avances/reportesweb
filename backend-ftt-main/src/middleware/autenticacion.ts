import { Request, Response, NextFunction } from 'express'

let jwt = require('jsonwebtoken');

//==================
//VERIFICAR TOKEN
//==================

export let verificaToken = (req: Request, res: Response, next: NextFunction) => {
    // NOMBRE DE HEADERS
    let token = req.get('token'); //authorization

    jwt.verify(token, 'peter', (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err: 'Token no valido'
            });
        }
        next(); // SIRVE PARA QUE CONTINUE CON LA EJECUCION DEL PROGRAMA

    })

}

