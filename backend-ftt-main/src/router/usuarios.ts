import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from "express";
import MySQL from "../mysql/mysql";

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      TURNOS POR FECHA                                                  ** **
 ** ************************************************************************************************************ **/

router.get("/turnosfecha", TokenValidation, (req: Request, res: Response) => {
  const query = `
        SELECT usua_nombre as Usuario, serv_nombre as Servicio,
            date_format(turn_fecha, "%Y-%m-%d") as Fecha, SUM(turn_estado = 1) AS Atendidos,
            SUM( turn_estado != 1 AND turn_estado != 0) AS No_Atendidos,
            SUM(turn_estado != 0) AS Total 
        FROM turno t, servicio s, usuarios u, cajero c
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo 
        GROUP BY Fecha, Usuario, Servicio
        ORDER BY Usuario, Fecha, Servicio;
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

router.get("/getallsucursales", TokenValidation, (req: Request, res: Response) => {
  const query = `
        SELECT * FROM empresa ORDER BY empr_nombre ASC;
        `;
  MySQL.ejecutarQuery(query, (err: any, empresas: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
      console.log(err);
    } else {
      res.json({
        ok: true,
        empresas,
      });
    }
  });
});

router.get("/getallcajeros", TokenValidation, (req: Request, res: Response) => {
  const query = `
        SELECT * FROM cajero usua_codigo != 2 ORDER BY caje_nombre ASC;
        `;
  MySQL.ejecutarQuery(query, (err: any, cajeros: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
    } else {
      res.json({
        ok: true,
        cajeros,
      });
    }
  });
});

router.get("/getallcajeros/:sucursales", TokenValidation, (req: Request, res: Response) => {
  const listaSucursales = req.params.sucursales;
  const sucursalesArray = listaSucursales.split(",");

  let todasSucursales = false;

  if (sucursalesArray.includes("-1")) {
    todasSucursales = true
  }

  const query = `
            SELECT c.caje_codigo, c.usua_codigo, c.caje_nombre, c.caje_estado 
            FROM cajero c, usuarios u 
            WHERE u.usua_codigo = c.usua_codigo
            ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
            AND u.usua_codigo != 2
            ORDER BY c.caje_nombre ASC;
            `;

  MySQL.ejecutarQuery(query, (err: any, cajeros: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
      console.log(err);
    } else {
      res.json({
        ok: true,
        cajeros,
      });
    }
  });
});

/** ************************************************************************************************************ **
 ** **                               TIEMPO PROMEDIO DE ATENCION                                              ** **
 ** ************************************************************************************************************ **/

router.get(
  "/tiempopromedioatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", TokenValidation,
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

    let query = `
    SELECT e.empr_nombre AS nombreEmpresa, serv_nombre AS Servicio, caje_nombre AS Nombre, 
    COUNT(turn_codigo) AS Turnos, 
    TIME_FORMAT(sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))), '%H:%i:%s') AS Promedio 
    FROM cajero c, turno t, servicio s, empresa e, usuarios u
    WHERE t.caje_codigo = c.caje_codigo 
    AND t.serv_codigo = s.serv_codigo 
    AND s.empr_codigo = e.empr_codigo  
    AND c.usua_codigo = u.usua_codigo
    AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
    AND u.usua_codigo != 2
    ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
    ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
    GROUP BY nombreEmpresa, Nombre, Servicio;
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
 ** **                               TIEMPO DE ATENCION POR TURNOS                                            ** **
 ** ************************************************************************************************************ **/

router.get(
  "/tiempoatencionturnos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", TokenValidation,
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

    let query = `
    SELECT e.empr_nombre AS nombreEmpresa, CAST(CONCAT(s.serv_descripcion,t.turn_numero) AS CHAR) AS turno, serv_nombre AS Servicio, caje_nombre AS Nombre, 
    sec_to_time(time_to_sec(turn_tiempoespera)) AS espera,
    sec_to_time(IFNUll(turn_duracionatencion, 0)) AS atencion,
    date_format(t.TURN_FECHA, '%Y-%m-%d') AS TURN_FECHA,
    CAST(CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS CHAR) AS hora
    FROM cajero c, turno t, servicio s, empresa e, usuarios u
    WHERE t.caje_codigo = c.caje_codigo 
    AND t.serv_codigo = s.serv_codigo 
    AND s.empr_codigo = e.empr_codigo  
    AND c.usua_codigo = u.usua_codigo
    AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
    AND u.usua_codigo != 2
    ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
    ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
    ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
    ORDER BY t.turn_codigo DESC, t.TURN_FECHA DESC, hora DESC;
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

router.get("/tiempopromedioatencion", TokenValidation, (req: Request, res: Response) => {
  const query = `
        SELECT serv_nombre AS Servicio, caje_nombre as Nombre,
            COUNT(turn_codigo) AS Turnos, 
            date_format(sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))), '%H:%i:%s') AS Promedio 
        FROM cajero c, turno t, servicio s 
        WHERE t.caje_codigo = c.caje_codigo 
        AND t.serv_codigo = s.serv_codigo
        GROUP BY Nombre, Servicio
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



/** ************************************************************************************************************ **
 ** **                               ENTRADAS Y SALIDAD DEL SISTEMA                                           ** **
 ** ************************************************************************************************************ **/

router.get(
  "/entradasalidasistema/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales", TokenValidation,
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
      todasSucursales = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    const query = `
      SELECT e.empr_nombre AS nombreEmpresa,
      usua_nombre AS Usuario,
      CAST(STR_TO_DATE(reg_fecha,'%Y-%m-%d') AS CHAR) AS fecha,
      CAST(CONCAT(LPAD(reg_hora, 2, '0'), ':', LPAD(reg_minuto, 2, '0')) AS CHAR) AS hora,
      CASE r.reg_estado
                WHEN 1 THEN 'Entrada Servicio'
                WHEN 2 THEN 'Salida Servicio'
                WHEN 3 THEN 'Entrada Emisión'
                ELSE 'Salida Emisión'
            END AS Razon
      FROM registro r, usuarios u, empresa e
      WHERE r.usua_codigo = u.usua_codigo
      ${todasSucursales ? 'AND u.empr_codigo = e.empr_codigo' : `AND u.empr_codigo IN (${listaSucursales})`}
      AND reg_fecha BETWEEN '${fDesde}' AND '${fHasta}'
      ${!diaCompleto ? `AND r.reg_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      AND u.usua_codigo != 2
      ORDER BY fecha DESC, hora DESC;
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
 ** **                                       ATENCION AL USUARIO                                              ** **
 ** ************************************************************************************************************ **/

router.get("/atencionusuario", TokenValidation, (req: Request, res: Response) => {
  const query = `
        SELECT usua_nombre AS Nombre, serv_nombre AS Servicio,
            SUM(turn_estado = 1) AS Atendidos
        FROM usuarios u, turno t, cajero c, servicio s
        WHERE u.usua_codigo = c.usua_codigo 
            AND c.caje_codigo = t.caje_codigo 
            AND t.serv_codigo = s.serv_codigo 
        GROUP BY Nombre, Servicio
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

router.get(
  "/atencionusuario/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales", TokenValidation,
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

    const query = `
    SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Nombre, serv_nombre AS Servicio, 
        SUM(turn_estado = 1) AS Atendidos,
        SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
        SUM(turn_estado != 0) AS Total 
    FROM usuarios u, turno t, cajero c, servicio s, empresa e 
    WHERE u.usua_codigo = c.usua_codigo 
        AND c.caje_codigo = t.caje_codigo 
        AND t.serv_codigo = s.serv_codigo 
        AND u.empr_codigo = e.empr_codigo 
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND u.usua_codigo != 2 
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY Servicio, Nombre, nombreEmpresa
        ORDER BY  Nombre ASC, Servicio ASC;
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
 ** **                                          TURNOS POR FECHA                                              ** **
 ** ************************************************************************************************************ **/

router.get("/turnosfecha/:fecha", TokenValidation, (req: Request, res: Response) => {
  let fechas = req.params.fecha;
  const query = `
        SELECT usua_nombre AS Usuario, serv_nombre AS Servicio, turn_fecha AS Fecha, 
            SUM(turn_estado = 1) AS Atendidos, 
            SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
            SUM(turn_estado != 0) AS Total  
        FROM turno t, servicio s, usuarios u, cajero c 
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo 
            AND turn_fecha = '${fechas}'  
        GROUP BY Fecha, Usuario, Servicio 
        ORDER BY Usuario, Fecha DESC, Servicio;`;
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

router.get(
  "/turnosfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");

    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if (cajerosArray.includes("-2")) {
      todasCajeros = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           s.serv_nombre AS Servicio, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha,
           SUM(turn_estado = 1) AS Atendidos, 
           SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
           SUM(turn_estado != 0) AS Total 
    FROM turno t 
    JOIN servicio s ON t.serv_codigo = s.serv_codigo 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
      ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
      ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
    GROUP BY nombreEmpresa, Fecha, Usuario, Servicio 
    ORDER BY Fecha DESC, Usuario, Servicio;
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

router.get(
  "/turnostotalfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");

    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if (cajerosArray.includes("-2")) {
      todasCajeros = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
           SUM(turn_estado = 1) AS Atendidos, 
           SUM(turn_estado != 1 AND turn_estado != 0) AS No_Atendidos, 
           SUM(turn_estado != 0) AS Total 
    FROM turno t 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
      ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
      ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
    GROUP BY nombreEmpresa, Fecha, Usuario
    ORDER BY Fecha DESC, Usuario;
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

router.get(
  "/turnosmeta/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");

    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if (cajerosArray.includes("-2")) {
      todasCajeros = true
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
           SUM(turn_estado = 1) AS Atendidos, 
           ROUND((SUM(turn_estado = 1) / (SELECT gene_valor FROM general WHERE gene_codigo = 9)) * 100,2) AS Porcentaje_Atendidos
    FROM turno t 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
      ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})` : ''}
      ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
    GROUP BY nombreEmpresa, Fecha, Usuario
    ORDER BY Fecha DESC, Usuario;
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

export default router;
