import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();


/** ************************************************************************************************************ **
 ** **                                    PANTALLA DE INICIO                                                  ** ** 
 ** ************************************************************************************************************ **/

/** ************************************************************************************************************ **
 ** **                                    TOTAL TICKETS EMITIDOS                                              ** ** 
 ** ************************************************************************************************************ **/

router.get('/totaltickets/:fecha', (req: Request, res: Response) => {

    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha as fecha, count(*) AS numeroturnos FROM turno WHERE turn_fecha = '${fechas}'
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


/** ************************************************************************************************************ **
 ** **                                PROMEDIO DE ATENCION POR SERVICIO                                       ** ** 
 ** ************************************************************************************************************ **/

router.get('/promedioatencionporservicio', (req: Request, res: Response) => {

    const query =
        `
        SELECT turn_codigo, serv_nombre, 
            date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') AS PromedioAtencion
        FROM turno, servicio
        WHERE turno.serv_codigo = servicio.serv_codigo
        GROUP BY turn_codigo, serv_nombre;
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


/** ************************************************************************************************************ **
 ** **                                           TOTAL ATENDIDOS                                              ** ** 
 ** ************************************************************************************************************ **/

router.get('/totalatendidos/:fecha', (req: Request, res: Response) => {
    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha, count(*) as atendidostotales 
        FROM turno  
        WHERE turn_estado = 1 and turn_fecha = '${fechas}'
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


/** ************************************************************************************************************ **
 ** **                                           TOTAL SIN ATENDER                                            ** ** 
 ** ************************************************************************************************************ **/

router.get('/totalsinatender/:fecha', (req: Request, res: Response) => {

    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha, count(turn_codigo) AS noatendidos 
        FROM turno 
        WHERE turn_estado = 2 and turn_fecha = '${fechas}'
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


/** ************************************************************************************************************ **
 ** **                                           PROMEDIO ATENCION                                            ** ** 
 ** ************************************************************************************************************ **/

router.get('/promedioatencion/:fecha', (req: Request, res: Response) => {

    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha, 
            date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') AS PromedioAtencion 
        FROM turno 
        WHERE turn_fecha = '${fechas}'
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


/** ************************************************************************************************************ **
 ** **                                         EVALUACION PROMEDIO                                            ** ** 
 ** ************************************************************************************************************ **/

router.get('/evapromedio', (req: Request, res: Response) => {

    const query =
        `
        SELECT IF(AVG(eval_califica)> = 42, 'Excelente',
            IF(AVG(eval_califica) >= 34, 'Muy Bueno',
            IF(AVG(eval_califica) >= 26, 'Bueno',
            IF(AVG(eval_califica) >= 18, 'Regular',
            IF(AVG(eval_califica) >= 10, 'Malo', 'No existe'))))) AS Promedio
        FROM evaluacion;
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


/** ************************************************************************************************************ **
 ** **                                          EVALUACION GRAFICO                                            ** ** 
 ** ************************************************************************************************************ **/

router.get('/evagraf', (req: Request, res: Response) => {

    const query =
        `
        SELECT 
            SUM(eval_califica = 50) AS Excelente,
            SUM(eval_califica = 40) AS Muy_Bueno,
            SUM(eval_califica = 30) AS Bueno,
            SUM(eval_califica = 20) AS Regular,
            SUM(eval_califica = 10) AS Malo,
            COUNT(eval_califica) AS Total,
            IF(AVG(eval_califica) >= 42, 'Excelente',
            IF(AVG(eval_califica) >= 34, 'Muy Bueno',
            IF(AVG(eval_califica) >= 26, 'Bueno',
            IF(AVG(eval_califica) >= 18, 'Regular',
            IF(AVG(eval_califica) >= 10, 'Malo', 'No existe'))))) AS Promedio
        FROM evaluacion;
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


/** ************************************************************************************************************ **
 ** **                                   TURNOS CON MAS ATENCIONES                                            ** ** 
 ** ************************************************************************************************************ **/

router.get('/turnate', (req: Request, res: Response) => {

    const query =
        `
        SELECT serv_nombre FROM servicio, turno
        WHERE servicio.serv_codigo = turno.serv_codigo
        GROUP BY serv_nombre;
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


/** ************************************************************************************************************ **
 ** **                                          SERVICIOS MAS SOLICITADOS                                     ** ** 
 ** ************************************************************************************************************ **/

router.get('/servsoli', (req: Request, res: Response) => {

    const query =
        `
        SELECT  serv_nombre as Servicio,
            SUM( turn_estado = 1 ) as Atendidos,
            SUM( turn_estado = 2 or turn_estado = -1 ) as No_Atendidos,
            COUNT( turn_estado ) as Total
        FROM turno t, servicio s, usuarios u, cajero c
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo
        GROUP BY  Servicio
        ORDER BY Total desc
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