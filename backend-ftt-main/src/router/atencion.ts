import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ********************************************************************************************************** **
 ** **                                    TIEMPOS COMPLETOS                                                 ** **
 ** ********************************************************************************************************** **/

router.get('/tiemposcompletos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', TokenValidation,
 (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;

    if (codigosArray.includes("-2")) {
        todosCajeros = true
    }

    if (sucursalesArray.includes("-1")) {
        todasSucursales = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Usuario,
            serv_nombre AS Servicio, date_format(turn_fecha, '%Y-%m-%d') AS Fecha,
            sec_to_time(avg(IFNULL(time_to_sec(turn_tiempoespera),0))) AS Tiempo_Espera,
            AVG(IFNULL(time_to_sec(turn_tiempoespera),0)) AS Espera,
            sec_to_Time(AVG(IFNULL(turn_duracionatencion,0))) AS Tiempo_Atencion,
            AVG(IFNULL(turn_duracionatencion,0)) AS Atencion
        FROM turno t, servicio s, usuarios u, cajero c, empresa e
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo
            AND u.usua_codigo = c.usua_codigo
            AND u.empr_codigo = e.empr_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND u.usua_codigo != 2
            ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
        GROUP BY Servicio, Usuario, Fecha
        ORDER BY Fecha DESC;
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

router.get('/promediosatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales', TokenValidation,
 (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaServicios = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todosServicios = false;
    let todasSucursales = false;
    let diaCompleto = false;

    if (sucursalesArray.includes("-1")) {
        todasSucursales = true
    }

    if (serviciosArray.includes("-1")) {
        todosServicios = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, t.SERV_CODIGO, s.SERV_NOMBRE,
            sec_to_time(avg(time_to_sec(turn_tiempoespera))) AS PromedioEspera,
            AVG(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T '))) AS Espera,
            SEC_TO_TIME(AVG(turn_duracionatencion)) AS PromedioAtencion,
            AVG(turn_duracionatencion) AS Atencion,
            date_format(t.TURN_FECHA, '%Y-%m-%d') AS TURN_FECHA, 
            (SELECT max(turn_fecha) FROM turno) AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima
        FROM turno t, servicio s, empresa e
        WHERE t.serv_codigo = s.serv_codigo
            AND t.turn_estado = 1
            AND s.empr_codigo = e.empr_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
            ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
            AND t.caje_codigo !=0
        GROUP BY t.serv_codigo, t.turn_fecha
        ORDER BY t.turn_fecha DESC;
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

/** ****************************************************************************************************** **
 ** **                                      TIEMPO DE ATENCION                                       ** **
 ** ****************************************************************************************************** **/

router.get('/tiempoatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales', TokenValidation,
 (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaServicios = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todosServicios = false;
    let todasSucursales = false;
    let diaCompleto = false;

    if (sucursalesArray.includes("-1")) {
        todasSucursales = true
    }

    if (serviciosArray.includes("-1")) {
        todosServicios = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, c.caje_nombre AS cajero, CAST(CONCAT(s.serv_descripcion,t.turn_numero) AS CHAR) AS turno, t.SERV_CODIGO, s.SERV_NOMBRE,
            sec_to_time(time_to_sec(turn_tiempoespera)) AS espera,
            SEC_TO_TIME(turn_duracionatencion) AS atencion,
            date_format(t.TURN_FECHA, '%Y-%m-%d') AS TURN_FECHA,
            CAST(CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS CHAR) AS hora
        FROM turno t, servicio s, empresa e, cajero c
        WHERE t.serv_codigo = s.serv_codigo
            AND t.caje_codigo = c.caje_codigo
            AND t.turn_estado = 1
            AND s.empr_codigo = e.empr_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
            ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
            AND t.caje_codigo !=0
            ORDER BY t.TURN_FECHA DESC, hora DESC, t.turn_codigo DESC;
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

/** ************************************************************************************************************* **
 ** **                                        MAXIMOS DE ATENCION                                              ** **
 ** ************************************************************************************************************* **/

router.get('/maxatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales', TokenValidation,
 (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaServicios = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todosServicios = false;
    let todasSucursales = false;
    let diaCompleto = false;

    if (sucursalesArray.includes("-1")) {
        todasSucursales = true
    }

    if (serviciosArray.includes("-1")) {
        todosServicios = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }
    const query =
        `
        SELECT empresa.empr_nombre AS nombreEmpresa, turno.SERV_CODIGO, servicio.SERV_NOMBRE,
            MAX(IFNULL(TURN_DURACIONATENCION,0)) AS duracion,
            SEC_TO_TIME(MAX(IFNULL(TURN_DURACIONATENCION,0))) AS Maximo,
            date_format(turno.TURN_FECHA, '%Y-%m-%d') AS Fecha,
            (SELECT MAX(turn_fecha) FROM turno) AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima
        FROM turno 
        INNER JOIN servicio
            ON turno.SERV_CODIGO = servicio.SERV_CODIGO
        INNER JOIN empresa
            ON servicio.empr_codigo = empresa.empr_codigo
            AND turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            ${!todasSucursales ? `AND servicio.empr_codigo IN (${listaSucursales})` : ''}
            ${!todosServicios ? `AND servicio.serv_codigo IN (${listaServicios})` : ''}
            ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
            AND turno.caje_codigo !=0
        GROUP BY turno.serv_codigo, turno.turn_fecha
        ORDER BY turno.turn_fecha DESC;
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

router.get('/atencionservicio/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', TokenValidation,
 (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;

    if (codigosArray.includes("-2")) {
        todosCajeros = true
    }

    if (sucursalesArray.includes("-1")) {
        todasSucursales = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Nombre, serv_nombre AS Servicio,
            SUM(turn_estado = 1) AS Atendidos,
            SUM(turn_estado != 1 AND turn_estado != 0) AS NoAtendidos,
            SUM(turn_estado != 0) AS total
        FROM usuarios u, turno t, cajero c, servicio s, empresa e
        WHERE u.usua_codigo = c.usua_codigo
            AND c.caje_codigo = t.caje_codigo
            AND t.serv_codigo = s.serv_codigo
            AND u.empr_codigo = e.empr_codigo
            AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            AND u.usua_codigo != 2
            ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
        GROUP BY Servicio, Nombre
        ORDER BY  Nombre ASC, Servicio ASC;
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

router.get('/graficoservicio/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales', TokenValidation,
 (req: Request, res: Response) => {
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

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
        diaCompleto = true;
    }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, serv_nombre AS Servicio,
            SUM(turn_estado = 1) AS Atendidos,
            SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos,
            SUM(turn_estado != 0) AS Total
        FROM turno t, servicio s, usuarios u, cajero c, empresa e
        WHERE t.serv_codigo = s.serv_codigo
            AND t.caje_codigo = c.caje_codigo
            AND u.usua_codigo = c.usua_codigo
            AND s.empr_codigo = e.empr_codigo
            AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
            AND u.usua_codigo !=2
            ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
        GROUP BY nombreEmpresa, Servicio
        ORDER BY Servicio;
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


/** ************************************************************************************************************* **
 ** **                                               MENU                                                      ** **
 ** ************************************************************************************************************* **/

router.get('/promediosatencionmenu/:fecha', TokenValidation, (req: Request, res: Response) => {
    let fechas = req.params.fecha;

    const query =
        `
        SELECT t.SERV_CODIGO, s.SERV_NOMBRE, 
            sec_to_time(avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T ')))) AS PromedioEspera, 
            avg(time_to_sec(STR_TO_DATE(turn_tiempoespera, ' %T '))) AS Espera, 
            SEC_TO_TIME(AVG(turn_duracionatencion)) AS PromedioAtencion, 
            AVG(turn_duracionatencion) AS Atencion, t.TURN_FECHA, 
            (SELECT max(turn_fecha) FROM turno) AS fechamaxima, 
            (SELECT MIN(turn_fecha) FROM turno) AS fechaminima 
        FROM turno t, servicio s 
        WHERE t.serv_codigo=s.serv_codigo 
            AND t.turn_estado = 1 
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