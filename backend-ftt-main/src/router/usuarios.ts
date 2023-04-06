import { Router, Request, Response } from "express";
import MySQL from "../mysql/mysql";

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      TURNOS POR FECHA                                                  ** **
 ** ************************************************************************************************************ **/

router.get("/turnosfecha", (req: Request, res: Response) => {
  const query = `
        SELECT usua_nombre as Usuario, serv_nombre as Servicio,
            date_format(turn_fecha, "%Y-%m-%d") as Fecha, SUM(turn_estado = 1) AS Atendidos,
            SUM( turn_estado = 2 OR turn_estado = -1 ) AS No_Atendidos,
            COUNT( turn_estado ) AS Total
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

router.get("/getallsucursales", (req: Request, res: Response) => {
  const query = `
        SELECT * FROM empresa ORDER BY empr_nombre;
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

router.get("/getallcajeros", (req: Request, res: Response) => {
  const query = `
        SELECT * FROM cajero usua_codigo != 2 ORDER BY caje_nombre;
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

router.get("/getallcajeros/:empresa", (req: Request, res: Response) => {
  const cEmpresa = req.params.empresa;
  let query;
  if (cEmpresa == "-1") {
    query = `
            SELECT c.caje_codigo, c.usua_codigo, c.caje_nombre, c.caje_estado 
            FROM cajero c, usuarios u 
            WHERE u.usua_codigo = c.usua_codigo
            AND u.usua_codigo != 2;
            `;
  } else {
    query = `
            SELECT c.caje_codigo, c.usua_codigo, c.caje_nombre, c.caje_estado 
            FROM cajero c, usuarios u 
            WHERE u.usua_codigo = c.usua_codigo AND u.empr_codigo = ${cEmpresa}
            AND u.usua_codigo != 2;
            `;
  }
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
  "/tiempopromedioatencion/:fechaDesde/:fechaHasta/:listaCodigos/:sucursal",
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cSucursal = req.params.sucursal;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    console.log(cSucursal);

    let todosCajeros = false;

    if (codigosArray.includes("-2")) {
      todosCajeros = true
    } 

    let query = `
    SELECT e.empr_nombre AS nombreEmpresa, serv_nombre AS Servicio, caje_nombre AS Nombre, 
    COUNT(turn_codigo) AS Turnos, 
    sec_to_time(AVG(IFNUll(turn_duracionatencion, 0))) AS Promedio 
    FROM cajero c, turno t, servicio s, empresa e, usuarios u
    WHERE t.caje_codigo = c.caje_codigo 
    AND t.serv_codigo = s.serv_codigo 
    AND s.empr_codigo = e.empr_codigo  
    AND c.usua_codigo = u.usua_codigo
    AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
    AND u.usua_codigo != 2
    `;
    if (todosCajeros) {
      if (cSucursal != "-1") {
        query += `AND u.empr_codigo = '${cSucursal}' `
      }
    } else {
      query += `AND c.caje_codigo IN (${listaCodigos}) `
    }
    query += `GROUP BY nombreEmpresa, Nombre, Servicio;`
    
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

router.get("/tiempopromedioatencion", (req: Request, res: Response) => {
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
  "/entradasalidasistema/:fechaDesde/:fechaHasta/:sucursales",
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todasSucursales = false;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    const query = `
      SELECT e.empr_nombre AS nombreEmpresa,
      usua_nombre AS Usuario,
      CAST(STR_TO_DATE(concat(reg_fecha," ",reg_hora,":",reg_minuto,":00"),'%Y-%m-%d %H:%i:%s') AS CHAR) AS fecha,
      reg_hora as Hora, reg_minuto as Minuto,
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
      AND u.usua_codigo != 2
      ORDER BY reg_fecha DESC, fecha;
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

router.get("/atencionusuario", (req: Request, res: Response) => {
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
  "/atencionusuario/:fechaDesde/:fechaHasta/:listaCodigos/:sucursal",
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cSucursal = req.params.sucursal;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");

    let todosCajeros = false;

    if (codigosArray.includes("-2")) {
      todosCajeros = true
    } 

    let query = `
    SELECT e.empr_nombre AS nombreEmpresa, usua_nombre AS Nombre, serv_nombre AS Servicio, 
        SUM(turn_estado = 1) AS Atendidos 
    FROM usuarios u, turno t, cajero c, servicio s, empresa e 
    WHERE u.usua_codigo = c.usua_codigo 
        AND c.caje_codigo = t.caje_codigo 
        AND t.serv_codigo = s.serv_codigo 
        AND u.empr_codigo = e.empr_codigo 
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        AND u.usua_codigo != 2 
  `;
    if (todosCajeros) {
      if (cSucursal != "-1") {
        query += `AND u.empr_codigo = '${cSucursal}' `;
      }
    } else {
      query += `AND c.caje_codigo IN (${listaCodigos}) `;
    }
    query += `GROUP BY Nombre, Servicio;`;

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

router.get("/turnosfecha/:fecha", (req: Request, res: Response) => {
  let fechas = req.params.fecha;
  const query = `
        SELECT usua_nombre AS Usuario, serv_nombre AS Servicio, turn_fecha AS Fecha, 
            SUM(turn_estado = 1) AS Atendidos, 
            SUM(turn_estado = 2 OR turn_estado = -1) AS No_Atendidos, 
            COUNT(turn_estado) AS Total 
        FROM turno t, servicio s, usuarios u, cajero c 
        WHERE t.serv_codigo = s.serv_codigo 
            AND t.caje_codigo = c.caje_codigo 
            AND u.usua_codigo = c.usua_codigo 
            AND turn_fecha = '${fechas}'  
        GROUP BY Fecha, Usuario, Servicio 
        ORDER BY Usuario, Fecha, Servicio;`;
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
  "/turnosfechas/:fechaDesde/:fechaHasta/:sucursales",
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    let todasSucursales = false;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    const query = `
    SELECT e.empr_nombre AS nombreEmpresa,
           u.usua_nombre AS Usuario, 
           s.serv_nombre AS Servicio, 
           DATE_FORMAT(turn_fecha, '%Y-%m-%d') AS Fecha, 
           SUM(turn_estado = 1) AS Atendidos, 
           SUM(turn_estado = 2 OR turn_estado = -1) AS No_Atendidos, 
           SUM(turn_estado != 0) AS Total 
    FROM turno t 
    JOIN servicio s ON t.serv_codigo = s.serv_codigo 
    JOIN cajero c ON t.caje_codigo = c.caje_codigo 
    JOIN usuarios u ON u.usua_codigo = c.usua_codigo 
    JOIN empresa e ON u.empr_codigo = e.empr_codigo
    WHERE turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
      AND u.usua_codigo != 2
      ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
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

export default router;
