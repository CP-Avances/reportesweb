import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      OCUPACION POR SERVICIOS                                           ** ** 
 ** ************************************************************************************************************ **/

router.get('/ocupacionservicios/:fechaDesde/:fechaHasta/:empresa', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
        query =
            `
            SELECT empresa.empr_nombre AS nombreEmpresa, COUNT(turno.TURN_ESTADO) AS total,
                servicio.SERV_NOMBRE, servicio.SERV_CODIGO,
                ROUND((COUNT(turno.TURN_ESTADO)*100)/
                (SELECT SUM(c) 
                    FROM (SELECT COUNT(turn_estado) AS c 
                        FROM turno
                        WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                        GROUP BY serv_codigo) as tl),2) AS PORCENTAJE,
                            date_format((SELECT MAX(turn_fecha) 
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'), '%Y-%m-%d') AS fechamaxima,
                            date_format((SELECT MIN(turn_fecha) 
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'), '%Y-%m-%d') AS fechaminima
            FROM servicio 
            INNER JOIN turno
                ON servicio.SERV_CODIGO = turno.SERV_CODIGO
            INNER JOIN empresa ON servicio.empr_codigo = empresa.empr_codigo
            WHERE turno.TURN_FECHA BETWEEN ' ${fDesde}' AND '${fHasta}'
            AND turno.caje_codigo != 0
            GROUP BY servicio.SERV_CODIGO;
            `
    } else {
        query =
            `
            SELECT COUNT(turno.TURN_ESTADO) AS total,
                servicio.SERV_NOMBRE, servicio.SERV_CODIGO,
                ROUND((COUNT(turno.TURN_ESTADO)*100) / (SELECT SUM(c) 
                    FROM (SELECT COUNT(turn_estado) as c 
                        FROM turno
                        WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                        GROUP BY serv_codigo) as tl),2) AS PORCENTAJE,
                            date_format((SELECT MAX(turn_fecha) FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'), '%Y-%m-%d') AS fechamaxima,
                                    date_format((SELECT MIN(turn_fecha) 
                                    FROM turno
                                    WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'), '%Y-%m-%d') AS fechaminima
            FROM  servicio 
            INNER JOIN turno
                ON servicio.SERV_CODIGO = turno.SERV_CODIGO
            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
                AND servicio.empr_codigo = ${cEmpresa}
                AND turno.caje_codigo != 0
            GROUP BY servicio.SERV_CODIGO;
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


/** ************************************************************************************************************ **
 ** **                                          GRAFICO OCUPACION                                             ** ** 
 ** ************************************************************************************************************ **/

router.get('/graficoocupacion/:fechaDesde/:fechaHasta/:empresa', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
        query =
            `
            SELECT empresa.empr_nombre AS nombreEmpresa, COUNT(turno.TURN_ESTADO) AS total,
                servicio.SERV_NOMBRE, servicio.SERV_CODIGO,
                ROUND((COUNT(turno.TURN_ESTADO)*100) / (SELECT SUM(c) 
                    FROM (SELECT COUNT(turn_estado) as c
                        FROM turno
                        WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                        GROUP BY serv_codigo) as tl),2)AS PORCENTAJE, 
                            (SELECT MAX(turn_fecha) 
                            FROM turno
                            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
                                (SELECT MIN(turn_fecha)
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') as fechaminima
            FROM servicio 
            INNER JOIN turno
                ON servicio.SERV_CODIGO = turno.SERV_CODIGO
            INNER JOIN empresa ON servicio.empr_codigo = empresa.empr_codigo
            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND turno.caje_codigo != 0
            GROUP BY servicio.SERV_CODIGO;
            `
    } else {
        query =
            `
            SELECT COUNT(turno.TURN_ESTADO) as total,
                servicio.SERV_NOMBRE, servicio.SERV_CODIGO,
                ROUND((COUNT(turno.TURN_ESTADO)*100) / (SELECT SUM(c) 
                    FROM (SELECT COUNT(turn_estado) as c
                        FROM turno
                        WHERE turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                        GROUP BY serv_codigo) as tl),2)AS PORCENTAJE,
                            (SELECT MAX(turn_fecha) 
                            FROM turno
                            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
                                (SELECT MIN(turn_fecha)
                                FROM turno
                                WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
            FROM servicio 
            INNER JOIN turno
                ON servicio.SERV_CODIGO = turno.SERV_CODIGO
            WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
                AND servicio.empr_codigo = ${cEmpresa}
                AND turno.caje_codigo != 0
            GROUP BY servicio.SERV_CODIGO;
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

router.get('/graficoocupacion/:fecha', (req: Request, res: Response) => {

    let fechas = req.params.fecha;
    const query =
        `
        SELECT COUNT(turno.TURN_ESTADO) AS total, servicio.SERV_NOMBRE, servicio.SERV_CODIGO, 
            ROUND((COUNT(turno.TURN_ESTADO)*100) / (SELECT SUM(c) 
                FROM (SELECT COUNT(turn_estado) as c FROM turno GROUP BY serv_codigo) AS tl),2) AS PORCENTAJE, 
                    (SELECT MAX(turn_fecha) 
                    FROM turno 
                    WHERE turno.TURN_FECHA = '${fechas}' AND turno.TURN_FECHA = '${fechas}' ) AS fechamaxima, 
                        (SELECT MIN(turn_fecha) 
                        FROM turno 
                        WHERE turno.TURN_FECHA = '${fechas}' AND turno.TURN_FECHA = '${fechas}' ) AS fechaminima 
        FROM servicio 
        INNER JOIN turno 
            ON servicio.SERV_CODIGO = turno.SERV_CODIGO 
        WHERE turno.TURN_FECHA = '${fechas}' 
            AND turno.TURN_FECHA = '${fechas}' 
            AND servicio.empr_codigo 
            AND servicio.serv_codigo  
        GROUP BY servicio.SERV_CODIGO;
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