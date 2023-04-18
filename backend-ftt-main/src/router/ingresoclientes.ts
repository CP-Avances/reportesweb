import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      INGRESO DE CLIENTES                                               ** ** 
 ** ************************************************************************************************************ **/

router.get('/ingresoclientes/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales', (req: Request, res: Response) => {
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

    const query = `
            SELECT e.empr_nombre AS nombreEmpresa, date_format(turn_fecha, '%Y-%m-%d') AS Fecha, 
            COUNT(turn_codigo) AS clientes,
            (SELECT MAX(turn_fecha) FROM turno
                WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno
                WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
            FROM turno turno, servicio s, empresa e
            WHERE turno.serv_codigo=s.serv_codigo
                AND s.empr_codigo = e.empr_codigo 
                AND turno.TURN_FECHA BETWEEN ' ${fDesde}' AND '${fHasta}'
                AND turno.caje_codigo != 0
                ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
                ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
            GROUP BY turn_fecha, nombreEmpresa
            ORDER BY turno.turn_fecha DESC;
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

router.get('/ingresoclientesmenu/:fecha', (req: Request, res: Response) => {

    let fechas = req.params.fecha;

    const query =
        `
        SELECT turn_fecha, count(turn_codigo) AS clientes, (SELECT MAX(turn_fecha) FROM turno) AS fechamaxima, 
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima 
        FROM turno turno, servicio s 
        WHERE turno.serv_codigo = s.serv_codigo
        AND turno.TURN_FECHA = ${fechas} 
        GROUP BY turn_fecha;
        `
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