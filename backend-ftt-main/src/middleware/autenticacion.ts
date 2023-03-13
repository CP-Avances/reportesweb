import { Router, Request, Response, NextFunction } from 'express'


let jwt = require('jsonwebtoken');


//==================
//VERIFICAR TOKEN
//==================

export let verificaToken = (req: Request, res: Response, next: NextFunction) => {
    //nombre de headers
    let token = req.get('token'); //authorization

    jwt.verify(token, 'peter', (err: any, decoded:any) => {
        if (err) {
            return res.status(401).json({

                ok: false,
                err: 'Token no valido'

            });
        }

        //req.usuarios[0] = decoded.usuario;
        next(); //srive para que continue con la ejecucion del programa

    })

}

