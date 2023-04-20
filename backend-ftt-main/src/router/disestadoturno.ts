import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ************************************************************************************************************* **
 ** **                                    DISTRIBUCION Y ESTADO DE TURNOS                                      ** **
 ** ************************************************************************************************************* **/

router.get('/distestadoturno/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', (req: Request, res: Response) => {
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

    if ((hInicio=="-1")||(hFin=="-1")||(parseInt(hInicio)>parseInt(hFin))) {
        diaCompleto = true;
      }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, c.caje_nombre AS Usuario, COUNT(t.turn_codigo) AS turnos,
            s.SERV_NOMBRE, date_format(t.TURN_FECHA, '%Y-%m-%d') AS fecha,
            SUM(t.TURN_ESTADO = 1) AS ATENDIDOS,
            SUM(t.TURN_ESTADO = 0) AS PENDIENTES,
            SUM(t.TURN_ESTADO = -1) AS EN_ATENCION,
            SUM(t.TURN_ESTADO = 3) AS EN_PAUSA,
            SUM(t.TURN_ESTADO = 2) AS NOATENDIDOS,
            (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
            (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
        FROM servicio s, turno t, cajero c, empresa e, usuarios u
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo
            AND s.empr_codigo = e.empr_codigo
            AND c.usua_codigo = u.usua_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND u.usua_codigo != 2
            ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
        GROUP BY t.serv_codigo, t.turn_fecha
        ORDER BY t.turn_fecha DESC, c.caje_nombre ASC;
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

/** ***************************************************************************************************************** **
 ** **                                    DISTRIBUCION Y ESTADO DE TURNOS RESUMEN                                  ** **
 ** ***************************************************************************************************************** **/

router.get('/distestadoturnoresumen/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', (req: Request, res: Response) => {
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

    if ((hInicio=="-1")||(hFin=="-1")||(parseInt(hInicio)>parseInt(hFin))) {
        diaCompleto = true;
      }

    const query =
        `
        SELECT e.empr_nombre AS nombreEmpresa, c.caje_nombre AS Usuario, COUNT(t.turn_codigo) AS turnos,
        s.SERV_NOMBRE,
        SUM(t.TURN_ESTADO = 1) AS ATENDIDOS,
        SUM(t.TURN_ESTADO = 0) AS PENDIENTES,
        SUM(t.TURN_ESTADO = -1) AS EN_ATENCION,
        SUM(t.TURN_ESTADO = 3) AS EN_PAUSA,
        SUM(t.TURN_ESTADO = 2) AS NOATENDIDOS,
        (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
        (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
        FROM servicio s, turno t, cajero c, empresa e, usuarios u
        WHERE s.serv_codigo = t.serv_codigo  
            AND c.caje_codigo = t.caje_codigo 
            AND s.empr_codigo = e.empr_codigo
            AND c.usua_codigo = u.usua_codigo
            AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            AND u.usua_codigo != 2
            ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFin}' ` : ''}
        GROUP BY t.serv_codigo, c.caje_codigo
        ORDER BY s.SERV_NOMBRE ASC, c.caje_nombre ASC;
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