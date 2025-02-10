import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();




/** ************************************************************************************************************* **
 ** **                                               MENU                                                      ** **
 ** ************************************************************************************************************* **/

router.get("/identificacionCliente", TokenValidation, (req: Request, res: Response) => {
    const query =
        `
        SELECT gene_valor FROM general WHERE gene_codigo = 11;
        `;

    MySQL.ejecutarQuery(query, (err: any, identificacion: string) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err,
            });
        } else {
            res.json({
                ok: true,
                valor: identificacion,
            });
        }
    });
});

export default router;