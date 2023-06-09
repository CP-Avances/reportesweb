import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ********************************************************************************************************** **
 ** **                                    TIEMPOS COMPLETOS                                                 ** **
 ** ********************************************************************************************************** **/

router.get('/tiemposcompletos/:fechaDesde/:fechaHasta/:cCajero', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario,
            serv_nombre AS Servicio, date_format(turn_fecha, '%Y-%m-%d') AS Fecha,
            date_format(sec_to_time(avg(IFNULL(time_to_sec(turn_tiempoespera),0))),'%H:%i:%s') AS Tiempo_Espera,
            AVG(IFNULL(time_to_sec(turn_tiempoespera),0)) AS Espera,
            date_format(sec_to_Time(AVG(IFNULL(turn_duracionatencion,0))), '%H:%i:%s') AS Tiempo_Atencion,
            AVG(IFNULL(turn_duracionatencion,0)) AS Atencion
        FROM turno t, servicio s, usuarios u, cajero c, empresa e
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo
            AND u.usua_codigo = c.usua_codigo
            AND u.empr_codigo = e.empr_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND c.caje_codigo = ${cCajero}
        GROUP BY Servicio, Usuario, Fecha
        ORDER BY Servicio, Usuario, Fecha;
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


/** ****************************************************************************************************** **
 ** **                                      PROMEDIOS DE ATENCION                                       ** **
 ** ****************************************************************************************************** **/

router.get('/promediosatencion/:fechaDesde/:fechaHasta/:cServ', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cServ = req.params.cServ;
    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, t.SERV_CODIGO, s.SERV_NOMBRE,
            date_format(sec_to_time(avg(time_to_sec(turn_tiempoespera))), '%H:%i:%s') AS PromedioEspera,
            AVG(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T '))) AS Espera,
            date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') AS PromedioAtencion,
            AVG(turn_duracionatencion) AS Atencion,
            date_format(t.TURN_FECHA, '%Y-%m-%d') AS TURN_FECHA, 
            (SELECT max(turn_fecha) FROM turno) AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima
        FROM turno t, servicio s, empresa e
        WHERE t.serv_codigo = s.serv_codigo
            AND t.turn_estado = 1
            AND s.empr_codigo = e.empr_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND s.serv_codigo = ${cServ}
        GROUP BY t.serv_codigo, t.turn_fecha;
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


/** ************************************************************************************************************* **
 ** **                                        MAXIMOS DE ATENCION                                              ** **
 ** ************************************************************************************************************* **/

router.get('/maxatencion/:fechaDesde/:fechaHasta/:cServ', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cServ = req.params.cServ;
    const query =
        `
        SELECT empresa.empr_nombre AS nombreEmpresa, turno.SERV_CODIGO, servicio.SERV_NOMBRE,
            MAX(IFNULL(TURN_DURACIONATENCION,0)) AS duracion,
            CONCAT(SEC_TO_TIME(MAX(IFNULL(TURN_DURACIONATENCION,0)))) AS Maximo,
            date_format(turno.TURN_FECHA, '%Y-%m-%d') AS Fecha,
            (SELECT MAX(turn_fecha) FROM turno) AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima
        FROM turno 
        INNER JOIN servicio
            ON turno.SERV_CODIGO = servicio.SERV_CODIGO
        INNER JOIN empresa
            ON servicio.empr_codigo = empresa.empr_codigo
            AND turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND servicio.serv_codigo = ${cServ}
        GROUP BY turno.serv_codigo, turno.turn_fecha;
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


/** ******************************************************************************************************* **
 ** **                                     ATENCION SERVICIO                                             ** ** 
 ** ******************************************************************************************************* **/

router.get('/atencionservicio/:fechaDesde/:fechaHasta/:cCajero', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cCajero = req.params.cCajero;
    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Nombre, serv_nombre AS Servicio,
            SUM(turn_estado = 1) AS Atendidos,
            SUM(turn_estado = -1 OR turn_estado = 2) AS NoAtendidos,
            SUM(turn_estado != 0) AS total
        FROM usuarios u, turno t, cajero c, servicio s, empresa e
        WHERE u.usua_codigo = c.usua_codigo
            AND c.caje_codigo = t.caje_codigo
            AND t.serv_codigo = s.serv_codigo
            AND u.empr_codigo = e.empr_codigo
            AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            AND c.caje_codigo = ${cCajero}
        GROUP BY Servicio, Nombre;
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


/** ***************************************************************************************************** **
 ** **                                   GRAFICO SERVICIO                                              ** ** 
 ** ***************************************************************************************************** **/

router.get('/graficoservicio/:fechaDesde/:fechaHasta/:empresa', (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
        query =
            `
            SELECT e.empr_nombre AS nombreEmpresa, serv_nombre AS Servicio,
                SUM(turn_estado = 1) AS Atendidos,
                SUM(turn_estado = 2 OR turn_estado = -1) AS No_Atendidos,
                SUM(turn_estado != 0) AS Total
            FROM turno t, servicio s, usuarios u, cajero c, empresa e
            WHERE t.serv_codigo = s.serv_codigo
                AND t.caje_codigo = c.caje_codigo
                AND u.usua_codigo = c.usua_codigo
                AND u.empr_codigo = e.empr_codigo
                AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            GROUP BY nombreEmpresa, Servicio
            ORDER BY Servicio;
            `
    } else {
        query =
            `
            SELECT serv_nombre AS Servicio,
                SUM( turn_estado = 1 ) AS Atendidos,
                SUM( turn_estado = 2 or turn_estado = -1 ) AS No_Atendidos,
                SUM( turn_estado!=0 ) AS Total
            FROM turno t, servicio s, usuarios u, cajero c
            WHERE t.serv_codigo = s.serv_codigo
                AND t.caje_codigo = c.caje_codigo
                AND u.usua_codigo = c.usua_codigo
                AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                AND s.empr_codigo = ${cEmpresa}
            GROUP BY Servicio
            ORDER BY Servicio;
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


/** ************************************************************************************************************* **
 ** **                                               MENU                                                      ** **
 ** ************************************************************************************************************* **/

router.get('/promediosatencionmenu/:fecha', (req: Request, res: Response) => {
    let fechas = req.params.fecha;

    const query =
        `
        SELECT t.SERV_CODIGO, s.SERV_NOMBRE, 
            date_format(sec_to_time(avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T ')))),'%H:%i:%s') AS PromedioEspera, 
            avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T '))) AS Espera, 
            date_format(SEC_TO_TIME(AVG(turn_duracionatencion)),'%H:%i:%s') AS PromedioAtencion, 
            AVG(turn_duracionatencion) AS Atencion, t.TURN_FECHA, 
            (SELECT max(turn_fecha) FROM turno) AS fechamaxima, 
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima 
        FROM turno t, servicio s 
        WHERE t.serv_codigo=s.serv_codigo 
            AND t.turn_estado = 1 
            AND s.empr_codigo
            AND t.TURN_FECHA = '${fechas}' 
        GROUP BY t.serv_codigo;
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