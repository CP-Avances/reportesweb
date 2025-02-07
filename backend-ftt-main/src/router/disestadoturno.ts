import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from 'express'
import MySQL from '../mysql/mysql';

const router = Router();

/** ************************************************************************************************************* **
 ** **                                    DISTRIBUCION Y ESTADO DE TURNOS                                      ** **
 ** ************************************************************************************************************* **/

router.get('/distestadoturno/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales/:servicios/:subservicios/:estado/:fecha', TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCajeros = req.params.listaCodigos;
    const codigosArray = listaCajeros.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    const listaServicios = req.params.servicios;
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    // VARIABLE QUE DEFINEN FECHA (1) O RANGO DE FECHAS (2)
    const fecha = req.params.fecha;
    let verFecha = true;

    let todasCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;

    if (codigosArray.includes("-2")) {
      todasCajeros = true
    }

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }


    if (Serviciosarray.includes("-1")) {
      todosServicios = true
    }

    if (subServiciosarray.includes("-1")) {
      todosSubservicio = true
    }

    let comprobarestado = ''
    if (estado == '3') {
      comprobarestado = `c.caje_estado != 0`
    } else {
      comprobarestado = `c.caje_estado = ${estado}`
    }
    // VALIDACION DE FECHAS
    if (fecha === "2") {
      verFecha = false;
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }
    /*
        const query =
          `
            SELECT 
              e.empr_nombre AS nombreEmpresa, 
              c.caje_nombre AS Usuario, 
              COUNT(t.turn_codigo) AS turnos,
              s.serv_nombre AS servicio, 
              ss.id AS id_subservicio, 
              ss.nombre AS subservicio, 
              DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS fecha,
              SUM(t.turn_estado = 1) AS atendidos,
              SUM(t.turn_estado = 0) AS pendientes,
              SUM(t.turn_estado = -1) AS en_atencion,
              SUM(t.turn_estado = 3) AS en_pausa,
              SUM(t.turn_estado = 2) AS no_atendidos,
              (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
              (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
            FROM 
              turno t
              JOIN servicio s ON t.serv_codigo = s.serv_codigo
              JOIN cajero c ON t.caje_codigo = c.caje_codigo
              JOIN empresa e ON s.empr_codigo = e.empr_codigo
              JOIN usuarios u ON c.usua_codigo = u.usua_codigo
              JOIN sub_servicio ss ON t.id_sub_serv = ss.id
            WHERE 
              u.usua_codigo != 2
              ${!todosCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
              ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
              ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
              AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
            GROUP BY 
              t.serv_codigo, t.turn_fecha, c.caje_codigo, ss.id, ss.nombre
            ORDER BY 
              c.caje_nombre ASC, 
              s.serv_nombre, 
              t.turn_fecha DESC;
            `;
    */

    let query = ''
    if (listaServicios != '0' && listaSubservicios != '0') {
      query =
        `
            SELECT 
              e.empr_nombre AS nombreEmpresa,
            ${listaCajeros != '0N' ? 'u.usua_nombre AS Usuario, ' : ''}   
              ss.id AS id_subservicio, 
              ss.nombre AS subservicio,
              s.serv_nombre AS Servicio, 
              ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,` : ''}
              COUNT(t.turn_codigo) AS turnos,
              SUM(t.turn_estado = 1) AS atendidos,
          SUM(t.turn_estado = 0) AS pendientes,
          SUM(t.turn_estado = -1) AS en_atencion,
          SUM(t.turn_estado = 3) AS en_pausa,
          SUM(t.turn_estado = 2) AS no_atendidos,
          (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
          (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima

            FROM 
              turno t
               ${listaCajeros != '0N' ?
          `INNER JOIN 
            cajero c ON t.caje_codigo = c.caje_codigo
            INNER JOIN 
            usuarios u ON u.usua_codigo = c.usua_codigo
                INNER JOIN 
              empresa e ON u.empr_codigo = e.empr_codigo
               INNER JOIN 
              servicio s ON t.serv_codigo = s.serv_codigo
            `
          :
          ` 
              INNER JOIN 
              servicio s ON t.serv_codigo = s.serv_codigo
              INNER JOIN empresa e ON s.empr_codigo = e.empr_codigo`}
        
            INNER JOIN 
              sub_servicio ss ON ss.id = t.id_sub_serv
            WHERE 
              ${listaCajeros != '0N' ? `turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' AND u.usua_codigo != 2` : `turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'`}
              ${!todasSucursales ? `AND e.empr_codigo IN (${listaSucursales})` : ''}
              ${listaCajeros != '0N' ? ` ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
              ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
              ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
              ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
            GROUP BY 
              e.empr_nombre, 
              ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'),` : ''}
              ${listaCajeros != '0N' ? 'u.usua_nombre,' : ''}
              ss.id, 
              ss.nombre,
              s.serv_nombre
    
            ORDER BY 
              ${verFecha ?
          `${listaCajeros != '0N' ? 'Fecha DESC, Usuario ASC, servicio DESC;' : 'Fecha DESC, servicio DESC;'}`
          : `${listaCajeros != '0N' ? 'Usuario ASC, servicio DESC;' : 'servicio DESC;'}`
        }
          `;

      console.log("ver query: ", query);

    } else if (listaSubservicios == '0' && listaServicios != '0') {
      query =
        `
          SELECT 
            e.empr_nombre AS nombreEmpresa,
            ${listaCajeros != '0N' ? 'u.usua_nombre AS Usuario, ' : ''}   
            s.serv_nombre AS Servicio, 
              ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,` : ''}
            COUNT(t.turn_codigo) AS turnos,
              SUM(t.turn_estado = 1) AS atendidos,
          SUM(t.turn_estado = 0) AS pendientes,
          SUM(t.turn_estado = -1) AS en_atencion,
          SUM(t.turn_estado = 3) AS en_pausa,
          SUM(t.turn_estado = 2) AS no_atendidos,
          (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
          (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima

          FROM 
            turno t
           ${listaCajeros != '0N' ?
          `INNER JOIN 
            cajero c ON t.caje_codigo = c.caje_codigo
            INNER JOIN 
            usuarios u ON u.usua_codigo = c.usua_codigo
             INNER JOIN 
            empresa e ON u.empr_codigo = e.empr_codigo
            INNER JOIN 
            servicio s ON t.serv_codigo = s.serv_codigo 
    
            `  :
          ` 
            INNER JOIN 
            servicio s ON t.serv_codigo = s.serv_codigo
            INNER JOIN empresa e ON s.empr_codigo = e.empr_codigo`}
          WHERE 
            ${listaCajeros != '0N' ? `turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' AND u.usua_codigo != 2` : `turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'`}
    
            ${!todasSucursales ? `AND e.empr_codigo IN (${listaSucursales})` : ''}
            ${listaCajeros != '0N' ? ` ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
            ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
            ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
          GROUP BY 
            e.empr_nombre, 
              ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'),` : ''}
              ${listaCajeros != '0N' ? 'u.usua_nombre,' : ''}
            s.serv_nombre
    
          ORDER BY         
          ${verFecha ?
          `${listaCajeros != '0N' ? 'Fecha DESC, Usuario ASC, servicio DESC;' : 'Fecha DESC, servicio DESC;'}`
          : `${listaCajeros != '0N' ? 'Usuario ASC, servicio DESC;' : 'servicio DESC;'}`
        }
            
          `;

    } else if (listaServicios == '0' && listaSubservicios == '0') {
      query =
        `
            SELECT 
              e.empr_nombre AS nombreEmpresa,
                ${listaCajeros != '0N' ? 'u.usua_nombre AS Usuario, ' : ''}   
              ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,` : ''}
            COUNT(t.turn_codigo) AS turnos,
              SUM(t.turn_estado = 1) AS atendidos,
          SUM(t.turn_estado = 0) AS pendientes,
          SUM(t.turn_estado = -1) AS en_atencion,
          SUM(t.turn_estado = 3) AS en_pausa,
          SUM(t.turn_estado = 2) AS no_atendidos,
          (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
          (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
              
            FROM 
              turno t
              INNER JOIN cajero c ON t.caje_codigo = c.caje_codigo  
              INNER JOIN usuarios u ON u.usua_codigo = c.usua_codigo
              INNER JOIN 
              empresa e ON u.empr_codigo = e.empr_codigo
            WHERE 
              ${listaCajeros != '0N' ? `turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' AND u.usua_codigo != 2` : `turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'`}
              ${!todasSucursales ? `AND e.empr_codigo IN (${listaSucursales})` : ''}
              ${listaCajeros != '0N' ? ` ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
              ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
            GROUP BY 
              e.empr_nombre 
              ${verFecha ? `,DATE_FORMAT(t.turn_fecha, '%Y-%m-%d')` : ''}
              ${listaCajeros != '0N' ? ',u.usua_nombre' : ''}
    
            
            ${verFecha ?
          `${listaCajeros != '0N' ? 'ORDER BY  Fecha DESC, Usuario ASC;' : ' ORDER BY  Fecha DESC;'}`
          : `${listaCajeros != '0N' ? 'ORDER BY  Usuario ASC;' : ''}`
        }
              
          `;
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

/** ***************************************************************************************************************** **
 ** **                                    DISTRIBUCION Y ESTADO DE TURNOS RESUMEN                                  ** **
 ** ***************************************************************************************************************** **/
/*
router.get('/distestadoturnoresumen/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales', TokenValidation,
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
    let hFinAux = 0;

    if (codigosArray.includes("-2")) {
      todosCajeros = true
    }

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    const query =
      `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          c.caje_nombre AS usuario, 
          COUNT(t.turn_codigo) AS turnos,
          s.serv_nombre AS servicio, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          SUM(t.turn_estado = 1) AS atendidos,
          SUM(t.turn_estado = 0) AS pendientes,
          SUM(t.turn_estado = -1) AS en_atencion,
          SUM(t.turn_estado = 3) AS en_pausa,
          SUM(t.turn_estado = 2) AS no_atendidos,
          (SELECT MAX(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechamaxima,
          (SELECT MIN(turn_fecha) FROM turno WHERE turno.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}') AS fechaminima
        FROM 
          servicio s
        JOIN turno t ON s.serv_codigo = t.serv_codigo
        JOIN cajero c ON c.caje_codigo = t.caje_codigo
        JOIN empresa e ON s.empr_codigo = e.empr_codigo
        JOIN usuarios u ON c.usua_codigo = u.usua_codigo
        JOIN sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
      GROUP BY 
        t.serv_codigo, c.caje_codigo, ss.id, ss.nombre
      ORDER BY 
        s.serv_nombre ASC, 
        c.caje_nombre ASC;
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
*/
export default router;