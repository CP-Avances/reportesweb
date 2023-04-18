import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ************************************************************************************************************* **
 ** **                                        ATENDIDOS MULTIPLES                                              ** ** 
 ** ************************************************************************************************************* **/

router.get('/atendidosmultiples/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todasSucursales = false;
    let diaCompleto = false;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if ((hInicio=="-1")||(hFin=="-1")||(parseInt(hInicio)>parseInt(hFin))) {
        diaCompleto = true;
      }

    const query =
            `
            SELECT em.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario, count(eval_codigo) AS Atendidos
            FROM usuarios u, evaluacion e, turno t, empresa em
            WHERE u.usua_codigo = e.usua_codigo
                AND t.turn_codigo = e.turn_codigo
                AND u.empr_codigo = em.empr_codigo
                AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                AND u.usua_codigo != 2
                ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
                ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
            GROUP BY usua_nombre, nombreEmpresa;
            `;
    
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