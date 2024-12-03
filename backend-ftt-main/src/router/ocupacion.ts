import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from "express";
import MySQL from "../mysql/mysql";

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      OCUPACION POR SERVICIOS                                           ** **
 ** ************************************************************************************************************ **/

router.get(
  "/ocupacionservicios/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true;
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
          COUNT(t.turn_estado) AS total,
          s.serv_nombre AS SERV_NOMBRE, 
          s.serv_codigo AS SERV_CODIGO, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio, 
          ROUND((COUNT(t.turn_estado) * 100) / (SELECT SUM(c) 
                                                FROM (SELECT COUNT(turn_estado) AS c 
                                                      FROM turno 
                                                      WHERE caje_codigo != 0
                                                        AND turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
                                                        ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
                                                      GROUP BY serv_codigo) AS tl), 2) AS PORCENTAJE,
          DATE_FORMAT(MAX(t.turn_fecha), '%Y-%m-%d') AS fechamaxima,
          DATE_FORMAT(MIN(t.turn_fecha), '%Y-%m-%d') AS fechaminima
        FROM 
          servicio s
        INNER JOIN 
          turno t ON s.serv_codigo = t.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        WHERE 
          t.caje_codigo != 0
          AND t.TURN_FECHA BETWEEN ' ${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND servicio.empr_codigo IN (${listaSucursales})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          s.serv_codigo, ss.id, ss.nombre, e.empr_nombre; 
      `;

    MySQL.ejecutarQuery(query, (err: any, turnos: Object[]) => {
      if (err) {
        res.status(400).json({
          ok: false,
          error: err,
        });
      } else {
        res.json({
          ok: true,
          turnos,
        });
      }
    });
  }
);

/** ************************************************************************************************************ **
 ** **                                          GRAFICO OCUPACION                                             ** **
 ** ************************************************************************************************************ **/

router.get(
  "/graficoocupacion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true;
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
          COUNT(t.turn_estado) AS total,
          s.serv_nombre AS SERV_NOMBRE, 
          s.serv_codigo AS SERV_CODIGO, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio, 
          ROUND((COUNT(t.turn_estado) * 100) / (SELECT SUM(c) 
                                              FROM (SELECT COUNT(turn_estado) AS c 
                                                    FROM turno 
                                                    WHERE caje_codigo != 0
                                                      AND turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
                                                      ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''} 
                                                    GROUP BY serv_codigo) AS tl), 2) AS PORCENTAJE,
          DATE_FORMAT(MAX(t.turn_fecha), '%Y-%m-%d') AS fechamaxima,
          DATE_FORMAT(MIN(t.turn_fecha), '%Y-%m-%d') AS fechaminima
        FROM 
          servicio s
        INNER JOIN 
          turno t ON s.serv_codigo = t.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        WHERE 
          t.caje_codigo != 0
          ${!todasSucursales ? `AND servicio.empr_codigo IN (${listaSucursales})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
          AND t.TURN_FECHA BETWEEN '${fDesde}' AND '${fHasta}'
        GROUP BY 
          s.serv_codigo, ss.id, ss.nombre, e.empr_nombre;
      `;

    MySQL.ejecutarQuery(query, (err: any, turnos: Object[]) => {
      if (err) {
        res.status(400).json({
          ok: false,
          error: err,
        });
      } else {
        res.json({
          ok: true,
          turnos,
        });
      }
    });
  }
);

router.get("/graficoocupacion/:fecha", TokenValidation, (req: Request, res: Response) => {
  let fechas = req.params.fecha;
  const query =
    `
      SELECT 
        s.serv_nombre, 
        s.serv_codigo, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio, 
        COUNT(t.turn_estado) AS total_turnos,
        ROUND(
          (COUNT(t.turn_estado) * 100) / total_turnos_servicio.total_turnos_servicio, 2
          ) AS porcentaje_turnos,
    -- Fecha máxima de turnos por subservicio
        DATE_FORMAT(MAX(t.turn_fecha), '%Y-%m-%d') AS fechamaxima,
    -- Fecha mínima de turnos por subservicio
        DATE_FORMAT(MIN(t.turn_fecha), '%Y-%m-%d') AS fechaminima
      FROM 
        servicio s
      INNER JOIN 
        turno t ON s.serv_codigo = t.serv_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
-- Subconsulta para calcular el total de turnos por servicio
      INNER JOIN (
        SELECT 
          serv_codigo, 
          COUNT(turn_estado) AS total_turnos_servicio
          FROM 
            turno
  -- Aquí puedes ajustar la fecha si es necesario
          WHERE turno.TURN_FECHA = '${fechas}'
          GROUP BY 
            serv_codigo
            ) total_turnos_servicio ON total_turnos_servicio.serv_codigo = s.serv_codigo
  -- Filtra por fecha
      WHERE t.TURN_FECHA = '${fechas}'
      GROUP BY 
        s.serv_codigo, ss.id, ss.nombre
      ORDER BY 
        s.serv_codigo, ss.id;
    `;
  MySQL.ejecutarQuery(query, (err: any, turnos: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
    } else {
      res.json({
        ok: true,
        turnos,
      });
    }
  });
});

export default router;
