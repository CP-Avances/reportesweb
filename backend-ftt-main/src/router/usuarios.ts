import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from "express";
import MySQL from "../mysql/mysql";
import { Console } from 'console';

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      TURNOS POR FECHA                                                  ** **
 ** ************************************************************************************************************ **/

router.get("/turnosfecha", TokenValidation, (req: Request, res: Response) => {
  const query =
    `
      SELECT 
        u.usua_nombre AS Usuario,
        s.serv_nombre AS Servicio,
        sub.id as id_subservicio,
        sub.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, "%Y-%m-%d") AS Fecha,
        SUM(t.turn_estado = 1) AS Atendidos,
        SUM(t.turn_estado NOT IN (1, 0)) AS No_Atendidos,
        SUM(t.turn_estado != 0) AS Total
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON c.usua_codigo = u.usua_codigo
      INNER JOIN 
        sub_servicio sub ON sub.id = t.id_sub_serv
      GROUP BY 
        u.usua_nombre, s.serv_nombre, sub.nombre, DATE_FORMAT(t.turn_fecha, "%Y-%m-%d")
      ORDER BY 
        u.usua_nombre, Fecha, s.serv_nombre;
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
  const query =
    `
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
  const query =
    `
      SELECT * FROM cajero 
      WHERE usua_codigo != 2 AND caje_estado = 2 
      ORDER BY caje_nombre ASC;
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

// METODO DE CAJEROS CON ESTADO
router.get("/cajerosEstado/estado", TokenValidation, (req: Request, res: Response) => {
  const estado_usuario = req.params.estado;
  // 1 --> INACTIVOS
  // 2 --> ACTIVOS
  // 3 --> TODOS

  const query =
    `
      SELECT * FROM cajero 
      WHERE usua_codigo != 2 AND caje_estado = ${estado_usuario}
      ORDER BY caje_nombre ASC;
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

  const query =
    `
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


// METODO DE BUSQUEDA DE CAJEROS DE ACUERDO A LA SUCURSAL Y ESTADO
router.get("/getallcajeros/:sucursales/:estado", TokenValidation, (req: Request, res: Response) => {
  // 1 --> INACTIVOS
  // 2 --> ACTIVOS
  // 3 --> TODOS
  // FILTROS SUCURSALES
  const listaSucursales = req.params.sucursales;
  const sucursalesArray = listaSucursales.split(",");
  let todasSucursales = false;
  // VALIDACIONES SUCURSALES
  if (sucursalesArray.includes("-1")) {
    todasSucursales = true
  }
  // FILTROS ESTADO
  const estado_usuario: any = req.params.estado;
  let estado = ``;
  if (estado_usuario != 3) {
    estado = `AND c.caje_estado = ${estado_usuario}`
  }

  const query =
    `
      SELECT c.caje_codigo, c.usua_codigo, c.caje_nombre, c.caje_estado 
      FROM cajero c, usuarios u 
      WHERE u.usua_codigo = c.usua_codigo
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        AND u.usua_codigo != 2
        ${estado}
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
  "/tiempopromedioatencion/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales/:servicios/:subservicios/:estado/:fecha", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
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

    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;


    if (codigosArray.includes("-2")) {
      todosCajeros = true
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

    let query = ''
    if (listaServicios != '0' && listaSubservicios != '0') {
      query =
        `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          s.serv_nombre AS Servicio, 
          ${listaCodigos != '0N' ? ' c.caje_nombre AS Nombre, ' : ''}   
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,` : ''}
          COUNT(t.turn_codigo) AS Turnos, 
          TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS Promedio
        FROM 
          turno t
          ${listaCodigos != '0N' ?
          `
            INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
          `
          :
          ` 
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
      `}

        WHERE 
        t.caje_codigo != 0 AND
          t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND e.empr_codigo IN (${listaSucursales})` : ''}
          ${listaCodigos != '0N' ? ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}

        GROUP BY 
          e.empr_nombre,
          ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'),` : ''}
          ${listaCodigos != '0N' ? 'u.usua_nombre,' : ''}
          s.serv_nombre, 
          ${listaCodigos != '0N' ? 'c.caje_nombre,' : ''}
          ss.id, 
          ss.nombre

           ORDER BY 
        ${verFecha ?
          `${listaCodigos != '0N' ? 'Fecha DESC, Nombre ASC, servicio DESC;' : 'Fecha DESC, servicio DESC;'}`
          :
          `${listaCodigos != '0N' ? 'Nombre ASC, servicio DESC;' : 'servicio DESC;'}`}
      `;
    } else if (listaSubservicios == '0' && listaServicios != '0') {
      query =
        `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          s.serv_nombre AS Servicio, 
          ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,` : ''}
          ${listaCodigos != '0N' ? ' c.caje_nombre AS Nombre, ' : ''}   
          COUNT(t.turn_codigo) AS Turnos, 
          TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS Promedio
        FROM 
          turno t
          ${listaCodigos != '0N' ?
          `
            INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
          `
          :
          `
          INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
      `}

        WHERE 
        t.caje_codigo != 0 AND
          t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${listaCodigos != '0N' ? ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre,
          ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'),` : ''} 
          ${listaCodigos != '0N' ? 'c.caje_nombre,' : ''}
          s.serv_nombre

          ORDER BY 
         ${verFecha ?
          `${listaCodigos != '0N' ? 'Fecha DESC, Nombre ASC, servicio DESC;' : 'Fecha DESC, servicio DESC;'}`
          :
          `${listaCodigos != '0N' ? 'Nombre ASC, servicio DESC;' : 'servicio DESC;'}`}
      `;
    } else if (listaServicios == '0' && listaSubservicios == '0') {
      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa, 
          ${listaCodigos != '0N' ? ' c.caje_nombre AS Nombre, ' : ''}   
         ${verFecha ? `DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,` : ''}
        COUNT(t.turn_codigo) AS Turnos, 
        TIME_FORMAT(SEC_TO_TIME(AVG(t.turn_duracionatencion)), '%H:%i:%s') AS Promedio
      FROM 
        turno t

      INNER JOIN 
       cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        usuarios u ON c.usua_codigo = u.usua_codigo
      INNER JOIN 
        empresa e ON u.empr_codigo = e.empr_codigo
       
      WHERE 
      t.caje_codigo != 0 AND
         t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${listaCodigos != '0N' ? ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      GROUP BY 
        ${verFecha ? ` 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d')`

          :
          ' e.empr_nombre'}

         ${listaCodigos != '0N' ? ',c.caje_nombre' : ''}


        ORDER BY 
        ${verFecha ? `Fecha DESC, e.empr_nombre ASC;` : 'e.empr_nombre ASC;'}
    `;
    }

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
  "/tiempoatencionturnos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:listaCodigos/:sucursales/:servicios/:subservicios/:estado", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");

    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios)
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios)
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    console.log("ver estado", estado)

    let todosCajeros = false;
    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;

    if (codigosArray.includes("-2")) {
      todosCajeros = true
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

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }


    let query = '';
    if (listaServicios != '0' && listaSubservicios != '0') {

      query =
        `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 

        CASE 
          WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 12) = 'servicio' 
          THEN CAST(CONCAT(s.serv_descripcion, LPAD(t.turn_numero, 3, '0')) AS CHAR)
          WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 12) = 'sub_servicio' 
          THEN CAST(CONCAT(ss.siglas,LPAD(t.turn_numero, 3, '0')) AS CHAR)
        ELSE NULL
        END AS turno,

          s.serv_nombre AS Servicio, 
          ${listaCodigos != '0N' ? ' c.caje_nombre AS Nombre, ' : ''}   
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          CASE 
          WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'nombre' THEN ct.nombre
          WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'cedula' THEN ct.cedula
          WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'otro' THEN ct.otro
          ELSE NULL
          END AS cliente,
          SEC_TO_TIME(TIME_TO_SEC(t.turn_tiempoespera)) AS espera,
          SEC_TO_TIME(IFNULL(t.turn_duracionatencion, 0)) AS atencion,
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS turn_fecha,
          CAST(CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS CHAR) AS hora
        FROM 
          turno t

  ${listaCodigos != '0N' ?
          `
             INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        INNER JOIN 
          cliente_turno ct ON ct.turn_codigo = t.turn_codigo
          `
          :
          ` 
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        INNER JOIN 
          cliente_turno ct ON ct.turn_codigo = t.turn_codigo
      `}


        WHERE 
        t.caje_codigo != 0 AND
          t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${listaCodigos != '0N' ? ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        ORDER BY 
          t.turn_codigo DESC, 
          t.turn_fecha DESC, 
          hora DESC;
      `;
    } else if (listaSubservicios == '0' && listaServicios != '0') {
      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa, 
      CASE 
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 12) = 'servicio' 
        THEN CAST(CONCAT(s.serv_descripcion, LPAD(t.turn_numero, 3, '0')) AS CHAR)
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 12) = 'sub_servicio' 
        THEN CAST(CONCAT(ss.siglas, LPAD(t.turn_numero, 3, '0')) AS CHAR)
      ELSE NULL
      END AS turno,

        s.serv_nombre AS Servicio, 
        ${listaCodigos != '0N' ? ' c.caje_nombre AS Nombre, ' : ''}   
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        CASE 
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'nombre' THEN ct.nombre
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'cedula' THEN ct.cedula
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'otro' THEN ct.otro

        ELSE NULL
        END AS cliente,        
        SEC_TO_TIME(TIME_TO_SEC(t.turn_tiempoespera)) AS espera,
        SEC_TO_TIME(IFNULL(t.turn_duracionatencion, 0)) AS atencion,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS turn_fecha,
        CAST(CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS CHAR) AS hora
      FROM 
        turno t

 ${listaCodigos != '0N' ?
          `
             INNER JOIN 
          cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          usuarios u ON c.usua_codigo = u.usua_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        INNER JOIN 
          cliente_turno ct ON ct.turn_codigo = t.turn_codigo
          `
          :
          ` 
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        INNER JOIN 
          cliente_turno ct ON ct.turn_codigo = t.turn_codigo
      `}

      WHERE 
t.caje_codigo != 0 AND
        t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${listaCodigos != '0N' ? ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      ORDER BY 
        t.turn_codigo DESC, 
        t.turn_fecha DESC, 
        hora DESC;
    `;
    } else if (listaServicios == '0' && listaSubservicios == '0') {
      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa, 
        CASE 
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 12) = 'servicio' 
          THEN CAST(CONCAT(s.serv_descripcion, LPAD(t.turn_numero, 3, '0')) AS CHAR)
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 12) = 'sub_servicio' 
          THEN CAST(CONCAT(ss.siglas,LPAD(t.turn_numero, 3, '0')) AS CHAR)
        ELSE NULL
      END AS turno,

        s.serv_nombre AS Servicio, 
        ${listaCodigos != '0N' ? ' c.caje_nombre AS Nombre, ' : ''}   
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        CASE 
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'nombre' THEN ct.nombre
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'cedula' THEN ct.cedula
        WHEN (SELECT gene_valor FROM general WHERE gene_codigo = 11) = 'otro' THEN ct.otro
        ELSE NULL
        END AS cliente,   
        SEC_TO_TIME(TIME_TO_SEC(t.turn_tiempoespera)) AS espera,
        SEC_TO_TIME(IFNULL(t.turn_duracionatencion, 0)) AS atencion,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS turn_fecha,
        CAST(CONCAT(LPAD(t.turn_hora, 2, '0'), ':', LPAD(t.turn_minuto, 2, '0')) AS CHAR) AS hora
      FROM 
        turno t
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      INNER JOIN 
        empresa e ON s.empr_codigo = e.empr_codigo
      INNER JOIN 
        usuarios u ON c.usua_codigo = u.usua_codigo
      INNER JOIN 
      sub_servicio ss ON ss.id = t.id_sub_serv
        INNER JOIN 
      cliente_turno ct ON ct.turn_codigo = t.turn_codigo

      WHERE 
        t.caje_codigo != 0 AND
        t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${listaCodigos != '0N' ? ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      ORDER BY 
        t.turn_codigo DESC, 
        t.turn_fecha DESC, 
        hora DESC;
    `;
    }



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
  const query =
    `
      SELECT 
        s.serv_nombre AS Servicio, 
        c.caje_nombre AS Nombre, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        COUNT(t.turn_codigo) AS Turnos, 
        TIME_FORMAT(SEC_TO_TIME(AVG(IFNULL(t.turn_duracionatencion, 0))), '%H:%i:%s') AS Promedio
      FROM 
        turno t
      INNER JOIN 
        cajero c ON t.caje_codigo = c.caje_codigo
      INNER JOIN 
        sub_servicio ss ON t.id_sub_serv = ss.id
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      GROUP BY 
        c.caje_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre;
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
  "/entradasalidasistema/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:listaCodigos/:estado", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const listaCodigos = req.params.listaCodigos;
    const codigosArray = listaCodigos.split(",");
    const sucursalesArray = listaSucursales.split(",");

    let todasSucursales = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosCajeros = false;
    const estado = req.params.estado;
    console.log("ver estado", estado)

    if (codigosArray.includes("-2")) {
      todosCajeros = true
    }

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }
    let comprobarestado = ''
    if (estado == '3') {
      comprobarestado = `c.caje_estado != 0`
    } else {
      comprobarestado = `c.caje_estado = ${estado}`
    }

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    const query =
      `
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
        FROM 
        registro r, 
        empresa e,
        usuarios u
        ${listaCodigos != '0N' ? `  
          INNER JOIN 
        cajero c ON u.usua_codigo = c.usua_codigo`
        : ''
      }   

        
      
        WHERE r.usua_codigo = u.usua_codigo
          ${todasSucursales ? 'AND u.empr_codigo = e.empr_codigo' : `AND u.empr_codigo IN (${listaSucursales})`}
          AND reg_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${listaCodigos != '0N' ?
        ` ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos}) AND ${comprobarestado}` : `AND ${comprobarestado}`}  `
        : ''}   
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
  const query =
    `
      SELECT 
        u.usua_nombre AS Nombre, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        SUM(t.turn_estado = 1) AS Atendidos
      FROM 
        usuarios u
      INNER JOIN 
        cajero c ON u.usua_codigo = c.usua_codigo
      INNER JOIN 
        turno t ON c.caje_codigo = t.caje_codigo
      INNER JOIN 
        sub_servicio ss ON t.id_sub_serv = ss.id
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      GROUP BY 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre;
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

    const query =
      `
        SELECT 
          e.empr_nombre AS nombreEmpresa, 
          u.usua_nombre AS Nombre, 
          s.serv_nombre AS Servicio, 
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          SUM(t.turn_estado = 1) AS Atendidos,
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total
        FROM 
          usuarios u
        INNER JOIN 
          cajero c ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
          turno t ON c.caje_codigo = t.caje_codigo
        INNER JOIN 
          sub_servicio ss ON t.id_sub_serv = ss.id
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
        WHERE 
          u.usua_codigo != 2
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todosCajeros ? `AND c.caje_codigo IN (${listaCodigos})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre, 
          u.usua_nombre, 
          s.serv_nombre, 
          ss.id, 
          ss.nombre
        ORDER BY 
          u.usua_nombre ASC, 
          s.serv_nombre ASC;
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
  const query =
    `
      SELECT 
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        t.turn_fecha AS Fecha, 
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
        sub_servicio ss ON t.id_sub_serv = ss.id
      WHERE 
        turn_fecha = '${fechas}'
      GROUP BY 
        t.turn_fecha, 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        u.usua_nombre ASC, 
        t.turn_fecha DESC, 
        s.serv_nombre ASC;
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
  "/turnosfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros/:servicios/:subservicios/:estado", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    console.log("ver listaSucursales: ", listaSucursales)
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    console.log("ver listaCajeros: ", listaCajeros)

    const cajerosArray = listaCajeros.split(",");
    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios)
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios)
    const subServiciosarray = listaSubservicios.split(",");

    const estado = req.params.estado;
    console.log("ver estado", estado)


    let todasSucursales = false;
    let todasCajeros = false;
    let todosServicios = false;
    let todosSubservicio = false;


    let diaCompleto = false;
    let hFinAux = 0;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if (cajerosArray.includes("-2")) {
      todasCajeros = true
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

    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }
    let query = ''
    if (listaServicios != '0' && listaSubservicios != '0') {
      console.log("entra a listaServicios != '0' && listaSubservicios != '0'")
      query =
        `
        SELECT 
          e.empr_nombre AS nombreEmpresa,
          u.usua_nombre AS Usuario, 
          s.serv_nombre AS Servicio, 
          ss.id AS id_subservicio,
          ss.nombre AS subservicio,
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
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
          empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
          sub_servicio ss ON ss.id = t.id_sub_serv
        WHERE 
          u.usua_codigo != 2
          AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
          ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
        GROUP BY 
          e.empr_nombre, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
          u.usua_nombre, 
          s.serv_nombre, 
          ss.id, 
          ss.nombre
        ORDER BY 
          Fecha DESC, 
          Usuario ASC, 
          Servicio ASC;
      `;
    } else if (listaSubservicios == '0' && listaServicios != '0') {
      console.log("listaSubservicios == '0' && listaServicios != '0'")

      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio,
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
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
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        Usuario ASC, 
        Servicio ASC;
    `;
    } else if (listaServicios == '0' && listaSubservicios == '0') {
      console.log("listaServicios == '0' && listaSubservicios == '0'")

      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        u.usua_nombre AS Usuario, 
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio,
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha,
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
        empresa e ON u.empr_codigo = e.empr_codigo
      INNER JOIN 
        sub_servicio ss ON ss.id = t.id_sub_serv
      WHERE 
        u.usua_codigo != 2
        AND turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        ${!todasSucursales ? `AND u.empr_codigo IN (${listaSucursales})` : ''}
        ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros})AND ${comprobarestado}` : `AND ${comprobarestado}`}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        u.usua_nombre, 
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        Usuario ASC, 
        Servicio ASC;
    `;

    }


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
  "/turnostotalfechas/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros/:servicios/:subservicios/:estado/:fecha", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");

    const listaServicios = req.params.servicios;
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    // VARIABLE QUE DEFINEN FECHA (1) O RANGO DE FECHAS (2)
    const fecha = req.params.fecha;
    let verFecha = true;

    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false;

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if (cajerosArray.includes("-2")) {
      todasCajeros = true
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
          SUM(t.turn_estado = 1) AS Atendidos, 
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total,
          ROUND((COUNT(t.turn_estado) * 100) / 
          (SELECT SUM(c) 
          FROM (SELECT COUNT(turn_estado) AS c 
          FROM turno 
          WHERE caje_codigo != 0
          AND turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
          ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' 
          AND '${hFinAux}' ` : ''}
          GROUP BY serv_codigo) AS tl), 2) AS PORCENTAJE

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
          t.caje_codigo != 0 AND
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
        SUM(t.turn_estado = 1) AS Atendidos, 
        SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
        SUM(t.turn_estado != 0) AS Total,
         ROUND((COUNT(t.turn_estado) * 100) / 
          (SELECT SUM(c) 
          FROM (SELECT COUNT(turn_estado) AS c 
          FROM turno 
          WHERE caje_codigo != 0
          AND turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
          ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' 
          AND '${hFinAux}' ` : ''}
          GROUP BY serv_codigo) AS tl), 2) AS PORCENTAJE
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
        t.caje_codigo != 0 AND
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
          SUM(t.turn_estado = 1) AS Atendidos, 
          SUM(t.turn_estado != 1 AND t.turn_estado != 0) AS No_Atendidos, 
          SUM(t.turn_estado != 0) AS Total,
           ROUND((COUNT(t.turn_estado) * 100) / 
          (SELECT SUM(c) 
          FROM (SELECT COUNT(turn_estado) AS c 
          FROM turno 
          WHERE caje_codigo != 0
          AND turno.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
          ${!diaCompleto ? `AND turno.turn_hora BETWEEN '${hInicio}' 
          AND '${hFinAux}' ` : ''}
          GROUP BY serv_codigo) AS tl), 2) AS PORCENTAJE
        FROM 
          turno t
          INNER JOIN cajero c ON t.caje_codigo = c.caje_codigo  
          INNER JOIN usuarios u ON u.usua_codigo = c.usua_codigo
          INNER JOIN 
          empresa e ON u.empr_codigo = e.empr_codigo
        WHERE 
          t.caje_codigo != 0 AND
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
  "/turnosmeta/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:cajeros/:servicios/:subservicios/:estado", TokenValidation,
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    // CAJEROS
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");

    const listaServicios = req.params.servicios;
    console.log("ver listaServicios", listaServicios)
    const Serviciosarray = listaServicios.split(",");
    const listaSubservicios = req.params.subservicios;
    console.log("ver listaSubservicios", listaSubservicios)
    const subServiciosarray = listaSubservicios.split(",");
    const estado = req.params.estado;
    console.log("ver estado", estado)

    let todasSucursales = false;
    let todasCajeros = false;
    let diaCompleto = false;
    let hFinAux = 0;
    let todosServicios = false;
    let todosSubservicio = false

    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }

    if (cajerosArray.includes("-2")) {
      todasCajeros = true
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


    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }



    let query = ''
    if (listaServicios != '0' && listaSubservicios != '0') {
      query =
        `
        SELECT 
          e.empr_nombre AS nombreEmpresa,
        ${listaCajeros != '0N' ? 'u.usua_nombre AS Usuario, ' : ''}   
          s.serv_nombre AS Servicio,  
          ss.id AS id_subservicio, 
          ss.nombre AS subservicio,
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
          SUM(t.turn_estado = 1) AS Atendidos, 
          ROUND(
            (SUM(t.turn_estado = 1) / 
            (SELECT g.gene_valor FROM general g WHERE g.gene_codigo = 9)) * 100, 2) AS Porcentaje_Atendidos
        FROM 
          turno t
        INNER JOIN 
          servicio s ON t.serv_codigo = s.serv_codigo
        
        ${listaCajeros != '0N' ?
          `
        INNER JOIN 
         cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
         usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
         empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
         sub_servicio ss ON ss.id = t.id_sub_serv
        `
          :
          ` 
        INNER JOIN 
         empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
         sub_servicio ss ON ss.id = t.id_sub_serv
          `
        }
        WHERE 
          t.caje_codigo != 0 AND
          turn_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          ${!todasSucursales ? `AND e.empr_codigo IN (${listaSucursales})` : ''}
          ${listaCajeros != '0N' ? ` ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
          ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
          ${!todosSubservicio ? `AND ss.id IN (${listaSubservicios})` : ''}
          ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}

        GROUP BY 
          e.empr_nombre, 
          DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
          ${listaCajeros != '0N' ? 'u.usua_nombre,' : ''}
          s.serv_nombre, 
          ss.id, 
          ss.nombre

        ORDER BY 
          Fecha DESC, 
          ${listaCajeros != '0N' ? ' Usuario ASC,' : ''}
          Servicio ASC;
      `;
      console.log("ver query: ", query)
    } else if (listaSubservicios == '0' && listaServicios != '0') {
      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        ${listaCajeros != '0N' ? 'u.usua_nombre AS Usuario, ' : ''}   
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(t.turn_estado = 1) AS Atendidos, 
        ROUND(
          (SUM(t.turn_estado = 1) / 
          (SELECT g.gene_valor FROM general g WHERE g.gene_codigo = 9)) * 100, 2) AS Porcentaje_Atendidos
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
      ${listaCajeros != '0N' ?
          `
        INNER JOIN 
         cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
         usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
         empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
         sub_servicio ss ON ss.id = t.id_sub_serv
        `
          :
          ` 
        INNER JOIN 
         empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
         sub_servicio ss ON ss.id = t.id_sub_serv
          `
        }

      WHERE 
        t.caje_codigo != 0 AND
        turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ${!todasSucursales ? `AND  e.empr_codigo IN (${listaSucursales})` : ''}
        ${listaCajeros != '0N' ? ` ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      
        GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        ${listaCajeros != '0N' ? 'u.usua_nombre,' : ''}
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        ${listaCajeros != '0N' ? ' Usuario ASC,' : ''}
        Servicio ASC;
    `;
    } else if (listaServicios == '0' && listaSubservicios == '0') {
      query =
        `
      SELECT 
        e.empr_nombre AS nombreEmpresa,
        ${listaCajeros != '0N' ? 'u.usua_nombre AS Usuario, ' : ''}   
        s.serv_nombre AS Servicio, 
        ss.id AS id_subservicio, 
        ss.nombre AS subservicio,
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d') AS Fecha, 
        SUM(t.turn_estado = 1) AS Atendidos, 
        ROUND(
          (SUM(t.turn_estado = 1) / 
          (SELECT g.gene_valor FROM general g WHERE g.gene_codigo = 9)) * 100, 2) AS Porcentaje_Atendidos
      FROM 
        turno t
      INNER JOIN 
        servicio s ON t.serv_codigo = s.serv_codigo
        ${listaCajeros != '0N' ?
          `
        INNER JOIN 
         cajero c ON t.caje_codigo = c.caje_codigo
        INNER JOIN 
         usuarios u ON u.usua_codigo = c.usua_codigo
        INNER JOIN 
         empresa e ON u.empr_codigo = e.empr_codigo
        INNER JOIN 
         sub_servicio ss ON ss.id = t.id_sub_serv
        `
          :
          ` 
        INNER JOIN 
         empresa e ON s.empr_codigo = e.empr_codigo
        INNER JOIN 
         sub_servicio ss ON ss.id = t.id_sub_serv
          `
        }
      WHERE 
        t.caje_codigo != 0 AND
        turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ${!todasSucursales ? `AND e.empr_codigo IN (${listaSucursales})` : ''}
        ${listaCajeros != '0N' ? ` ${!todasCajeros ? `AND c.caje_codigo IN (${listaCajeros}) AND ${comprobarestado}` : `AND ${comprobarestado}`} ` : ''}
        ${!diaCompleto ? `AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' ` : ''}
      
      GROUP BY 
        e.empr_nombre, 
        DATE_FORMAT(t.turn_fecha, '%Y-%m-%d'), 
        ${listaCajeros != '0N' ? 'u.usua_nombre,' : ''}
        s.serv_nombre, 
        ss.id, 
        ss.nombre
      ORDER BY 
        Fecha DESC, 
        ${listaCajeros != '0N' ? ' Usuario ASC,' : ''}
        Servicio ASC;
    `;

    }




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
