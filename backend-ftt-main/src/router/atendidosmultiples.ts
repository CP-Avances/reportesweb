import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ************************************************************************************************************* **
 ** **                                        ATENDIDOS MULTIPLES                                              ** ** 
 ** ************************************************************************************************************* **/

router.get('/atendidosmultiples/:fechaDesde/:fechaHasta/:empresa', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;

    let query;

    if (cEmpresa == "-1") {
        query =
            `
            SELECT em.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario, count(eval_codigo) AS Atendidos
            FROM usuarios u, evaluacion e, turno t, empresa em
            WHERE u.usua_codigo = e.usua_codigo
                AND t.turn_codigo = e.turn_codigo
                AND u.empr_codigo = em.empr_codigo
                AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            GROUP BY usua_nombre, nombreEmpresa;
            `
    } else {
        query =
            `
            SELECT usua_nombre AS Usuario, count(eval_codigo) AS Atendidos
            FROM usuarios u, evaluacion e, turno t
            WHERE u.usua_codigo = e.usua_codigo
                AND t.turn_codigo = e.turn_codigo
                AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                AND u.empr_codigo = ${cEmpresa}
            GROUP BY usua_nombre;
            `
    }
    MySQL.ejecutarQuery(query, (err: any, turnos: Object[]) => {
        if (err) {
            res.status(400).json({
                ok: false,
                error: err
            });
        } else {
            res.json({
                ok: true,
                turnos
            })
        }
    })
});

export default router;