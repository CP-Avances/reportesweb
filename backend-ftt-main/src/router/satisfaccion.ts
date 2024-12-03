import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();


/** ************************************************************************************************************ **
 ** **                                    PANTALLA DE INICIO                                                  ** ** 
 ** ************************************************************************************************************ **/

/** ************************************************************************************************************ **
 ** **                                    TOTAL TICKETS EMITIDOS                                              ** ** 
 ** ************************************************************************************************************ **/

router.get('/totaltickets/:fecha', TokenValidation, (req: Request, res: Response) => {

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

router.get('/promedioatencionporservicio', TokenValidation, (req: Request, res: Response) => {

    const query =
        `
            SELECT 
                t.turn_codigo, 
                s.serv_nombre, 
                ss.id AS id_subservicio, 
                ss.nombre AS subservicio,
                DATE_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS PromedioAtencion
            FROM 
                turno t
            INNER JOIN 
                servicio s ON t.serv_codigo = s.serv_codigo
            INNER JOIN 
                sub_servicio ss ON t.id_sub_serv = ss.id
            WHERE 
                t.caje_codigo != 0
            GROUP BY 
                t.turn_codigo, 
                s.serv_nombre, 
                ss.id, 
                ss.nombre;
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

router.get('/totalatendidos/:fecha', TokenValidation, (req: Request, res: Response) => {
    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha, count(*) as atendidostotales 
        FROM turno  
        WHERE turn_estado = 1 and turn_fecha = '${fechas}'
        AND caje_codigo !=0
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

router.get('/totalsinatender/:fecha', TokenValidation, (req: Request, res: Response) => {

    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha, count(turn_codigo) AS noatendidos 
        FROM turno 
        WHERE turn_estado = 2 AND turn_fecha = '${fechas}'
        AND caje_codigo !=0
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

router.get('/promedioatencion/:fecha', TokenValidation, (req: Request, res: Response) => {

    let fechas = req.params.fecha;
    const query =
        `
        SELECT turn_fecha, 
        TIME_FORMAT(sec_to_time(AVG(turn_duracionatencion)), '%H:%i:%s') AS PromedioAtencion 
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

router.get('/evapromedio', TokenValidation, (req: Request, res: Response) => {

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

router.get('/evagraf', TokenValidation, (req: Request, res: Response) => {

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

router.get('/turnate', TokenValidation, (req: Request, res: Response) => {

    const query =
        `
            SELECT 
                s.serv_nombre, 
                ss.id AS id_subservicio, 
                ss.nombre AS subservicio
            FROM 
                servicio s
            INNER JOIN 
                turno t ON s.serv_codigo = t.serv_codigo
            INNER JOIN 
                sub_servicio ss ON t.id_sub_serv = ss.id
            GROUP BY 
                s.serv_nombre, 
                ss.id, 
                ss.nombre;
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

router.get('/servsoli', TokenValidation, (req: Request, res: Response) => {

    const query =
        `
            SELECT  
                s.serv_codigo AS id_servicio,
                s.serv_nombre AS Servicio, 
                ss.id AS id_subservicio, 
                ss.nombre AS subservicio,
                SUM(t.turn_estado = 1) AS Atendidos,
                SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos,
                SUM(t.turn_estado != 0) AS Total 
            FROM 
                turno t
            INNER JOIN 
                servicio s ON t.serv_codigo = s.serv_codigo
            INNER JOIN 
                cajero c ON t.caje_codigo = c.caje_codigo
            INNER JOIN 
                usuarios u ON u.usua_codigo = c.usua_codigo
            INNER JOIN 
                sub_servicio ss ON ss.id = t.id_sub_serv
            GROUP BY  
                s.serv_nombre, ss.id, ss.nombre, s.serv_codigo 
            ORDER BY 
                s.serv_nombre, Total DESC;
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