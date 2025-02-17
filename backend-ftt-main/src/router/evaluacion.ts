import { TokenValidation } from '../libs/verifivarToken';
import { Router, Request, Response } from "express";
import MySQL from "../mysql/mysql";

const router = Router();

/** ************************************************************************************************************ **
 ** **                                      SERVICIO                                                          ** **
 ** ************************************************************************************************************ **/

// METODO DE BUSQUEDA DE EVALUACIONES POR CAJERO - POR SERVICIO - POR SUBSERVICIO
router.get(
  "/evaluacion/resumen/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales/:subservicio/:cajero/:opcion/:estado/:fecha", TokenValidation,
  (req: Request, res: Response) => {

    // VARIABLES DE FECHAS
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    // VARIABLES DE HORAS
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    let diaCompleto = false;
    let hFinAux = 0;
    // VARIABLE QUE DEFINEN FECHA (1) O RANGO DE FECHAS (2)
    const fecha = req.params.fecha;
    let verFecha = true;
    // VARIBALE DE OPCIONES DE BOTONES (TRUE -> 4 -- FALSE -> 5)
    const opcion = req.params.opcion;
    let opciones = false;
    // VARIABLE DE ESTADO DEL USUARIO
    const estado = req.params.estado;
    let estadoUsuario = false;
    // FILTROS DE SUCURSALES
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    // FILTROS DE SERVICIOS
    const listaServicios: any = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    let todosServicios = false;
    // FILTROS DE CAJEROS
    const listaCajeros = req.params.cajero;
    const cajerosArray = listaCajeros.split(",");
    let todosCajeros = false;
    // FILTROS DE SUBSERVICIOS
    const listaSubservicios = req.params.subservicio;
    const subserviciosArray = listaSubservicios.split(",");
    let todosSubservicios = false;

    // VALIDACION DE SUCURSALES
    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }
    // VALIDACION DE SERVICIOS
    if (serviciosArray.includes("-1")) {
      todosServicios = true
    }
    // VALIDACION DE CAJEROS
    if (cajerosArray.includes("-1")) {
      todosCajeros = true
    }
    // VALIDACION DE SUBSERVICIOS
    if (subserviciosArray.includes("-1")) {
      todosSubservicios = true
    }
    // VALIDACION DE HORAS
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }
    // VALIDACION DE OPCIONES
    if (opcion == "true") {
      opciones = true;
    }
    // VALIDACION DE FECHAS
    if (fecha === "2") {
      verFecha = false;
    }

    let query;

    // CREAR SQL DE ACUERDO A LAS VALIDACIONES
    let columnas =
      `
      e.empr_nombre AS nombreEmpresa,
      `;

    if (verFecha === true) {
      columnas += `DATE_FORMAT(f.eval_fecha, '%Y-%m-%d') AS Fecha,`;
    }
    if (listaServicios != '0N') {
      columnas += `s.serv_codigo, s.serv_nombre AS Servicio,`;
    }
    if (listaSubservicios != '0N') {
      columnas += `ss.id AS sub_codigo, ss.nombre AS subservicio,`;
    }
    if (listaCajeros != '0N') {
      columnas += `a.usua_codigo, a.usua_nombre AS Usuario,`;
      estadoUsuario = true;
    }
    if (!opciones) {
      columnas += `SUM(eval_califica = 50) AS Excelente,`;
      columnas += `SUM(eval_califica = 40) AS Muy_Bueno,`;
    } else {
      columnas += `SUM(eval_califica = 40) AS Excelente,`;
    }

    columnas +=
      `
      SUM(eval_califica = 30) AS Bueno,
      SUM(eval_califica = 20) AS Regular,
      SUM(eval_califica = 10) AS Malo,
      0 AS Omitidas,
      COUNT(eval_califica) AS Evaluadas,
      COUNT(eval_califica) AS Total
      `;

    let promedio = ``;
    if (!opciones) {
      promedio += `IF(AVG(eval_califica) >= 42, 'Excelente', `;
      promedio += `IF(AVG(eval_califica) >= 34, 'Muy Bueno', `;
      promedio +=
        `
        IF(AVG(eval_califica) >= 26, 'Bueno',
          IF(AVG(eval_califica) >= 18, 'Regular',
            IF(AVG(eval_califica) >= 10, 'Malo', 'No existe')
            )
          )
        )
        ) AS Promedio
        `;
    } else {
      promedio += `IF(AVG(eval_califica) >= 34, 'Excelente', `;
      promedio +=
        `
        IF(AVG(eval_califica) >= 26, 'Bueno',
          IF(AVG(eval_califica) >= 18, 'Regular',
            IF(AVG(eval_califica) >= 10, 'Malo', 'No existe')
            )
          )
        ) AS Promedio
        `;
    }

    let filtros =
      `
        WHERE a.usua_codigo != 2 
      `;

   (estado != '3')? filtros += ` AND c.caje_estado = ${estado}`: '';

    if (opciones) filtros += ` AND f.eval_califica != 50 `;
    if (!todasSucursales) filtros += ` AND a.empr_codigo IN (${listaSucursales}) `;
    if (listaServicios != '0N') {
      if (!todosServicios) filtros += ` AND s.serv_codigo IN (${listaServicios}) `;
    }
    if (listaSubservicios != '0N') {
      if (!todosSubservicios) filtros += ` AND ss.id IN (${listaSubservicios}) `;
    }
    if (listaCajeros != '0N') {
      if (!todosCajeros) filtros += ` AND a.usua_codigo IN (${listaCajeros}) `;
    }
    if (!diaCompleto) filtros += ` AND f.eval_hora BETWEEN '${hInicio}' AND '${hFinAux}' `;
    filtros += ` AND f.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}' `;

    let grupo_order = ``

    if (listaServicios != '0N' && listaSubservicios != '0N' && listaCajeros != '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, f.eval_fecha, a.usua_codigo, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre, f.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, a.usua_codigo, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }

    }

    if (listaServicios != '0N' && listaSubservicios != '0N' && listaCajeros === '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo, f.eval_fecha, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre, f.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }
    }

    if (listaServicios != '0N' && listaSubservicios === '0N' && listaCajeros != '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, f.eval_fecha, a.usua_codigo
            ORDER BY 
              s.serv_nombre, f.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, a.usua_codigo
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }
    }

    if (listaServicios != '0N' && listaSubservicios === '0N' && listaCajeros === '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo, f.eval_fecha
            ORDER BY 
              s.serv_nombre, f.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }
    }

    if (listaServicios === '0N' && listaSubservicios === '0N' && listaCajeros != '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, f.eval_fecha, a.usua_codigo
            ORDER BY 
              f.eval_fecha DESC;
            `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, a.usua_codigo
            ORDER BY 
              e.empr_nombre DESC;
          `;
      }
    }

    if (listaServicios === '0N' && listaSubservicios === '0N' && listaCajeros === '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, f.eval_fecha
            ORDER BY 
              f.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre
            ORDER BY 
              e.empr_nombre DESC;
          `;
      }
    }

    let consulta =
      `
      SELECT 
        ${columnas},
        ${promedio}
      FROM 
        usuarios a
      INNER JOIN evaluacion f ON a.usua_codigo = f.usua_codigo
      INNER JOIN cajero c ON c.usua_codigo = a.usua_codigo
      INNER JOIN empresa e ON e.empr_codigo = a.empr_codigo
      INNER JOIN turno t ON t.turn_codigo = f.turn_codigo
      INNER JOIN servicio s ON s.serv_codigo = t.serv_codigo
      INNER JOIN sub_servicio ss ON ss.id = t.id_sub_serv
      ${filtros}
      ${grupo_order}
      `;
    console.log('consulta ', consulta)

    query = consulta

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

// METODO DE BUSQUEDA DE EVALUACIONES OMITIDAS POR CAJERO - POR SERVICIO - POR SUBSERVICIO
router.get(
  "/evaluacion/omitidas/resumen/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:servicios/:sucursales/:subservicio/:cajero/:opcion/:estado/:fecha", TokenValidation,
  (req: Request, res: Response) => {

    // VARIABLES DE FECHAS
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    // VARIABLES DE HORAS
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    let diaCompleto = false;
    let hFinAux = 0;
    // VARIABLE QUE DEFINEN FECHA (1) O RANGO DE FECHAS (2)
    const fecha = req.params.fecha;
    let verFecha = true;
    // VARIBALE DE OPCIONES DE BOTONES (TRUE -> 4 -- FALSE -> 5)
    const opcion = req.params.opcion;
    let opciones = false;
    // VARIABLE DE ESTADO DEL USUARIO
    const estado = req.params.estado;
    let estadoUsuario = false;
    // FILTROS DE SUCURSALES
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    // FILTROS DE SERVICIOS
    const listaServicios: any = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    let todosServicios = false;
    // FILTROS DE CAJEROS
    const listaCajeros = req.params.cajero;
    const cajerosArray = listaCajeros.split(",");
    let todosCajeros = false;
    // FILTROS DE SUBSERVICIOS
    const listaSubservicios = req.params.subservicio;
    const subserviciosArray = listaSubservicios.split(",");
    let todosSubservicios = false;

    // VALIDACION DE SUCURSALES
    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }
    // VALIDACION DE SERVICIOS
    if (serviciosArray.includes("-1")) {
      todosServicios = true
    }
    // VALIDACION DE CAJEROS
    if (cajerosArray.includes("-1")) {
      todosCajeros = true
    }
    // VALIDACION DE SUBSERVICIOS
    if (subserviciosArray.includes("-1")) {
      todosSubservicios = true
    }
    // VALIDACION DE HORAS
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }
    // VALIDACION DE OPCIONES
    if (opcion == "true") {
      opciones = true;
    }
    // VALIDACION DE FECHAS
    if (fecha === "2") {
      verFecha = false;
    }

    let query;

    // CREAR SQL DE ACUERDO A LAS VALIDACIONES
    let columnas =
      `
      e.empr_nombre AS nombreEmpresa,
      `;

    if (verFecha === true) {
      columnas += `DATE_FORMAT(ne.eval_fecha, '%Y-%m-%d') AS Fecha,`;
    }
    if (listaServicios != '0N') {
      columnas += `s.serv_nombre AS Servicio, s.serv_codigo,`;
    }
    if (listaSubservicios != '0N') {
      columnas += `ss.nombre AS subservicio, ss.id AS sub_codigo,`;
    }
    if (listaCajeros != '0N') {
      columnas += `a.usua_nombre AS Usuario, a.usua_codigo,`;
      estadoUsuario = true;
    }

    columnas +=
      `
        0 AS Excelente,
        0 AS Muy_Bueno,
        0 AS Bueno,
        0 AS Regular,
        0 AS Malo,
        0 AS Evaluadas,
        COUNT(DISTINCT ne.eval_codigo) AS Omitidas,
        COUNT(DISTINCT ne.eval_codigo) AS Total,
        'Sin evaluación' AS Promedio
      `;

    let filtros =
      `
        WHERE a.usua_codigo != 2 
      `;


    (estado != '3')? filtros += ` AND c.caje_estado = ${estado}`: '';
    if (!todasSucursales) filtros += ` AND a.empr_codigo IN (${listaSucursales}) `;
    if (listaServicios != '0N') {
      if (!todosServicios) filtros += ` AND s.serv_codigo IN (${listaServicios}) `;
    }
    if (listaSubservicios != '0N') {
      if (!todosSubservicios) filtros += ` AND ss.id IN (${listaSubservicios}) `;
    }
    if (listaCajeros != '0N') {
      if (!todosCajeros) filtros += ` AND a.usua_codigo IN (${listaCajeros}) `;
    }
    if (!diaCompleto) filtros += ` AND ne.eval_hora BETWEEN '${hInicio}' AND '${hFinAux}' `;
    filtros += ` AND ne.eval_fecha BETWEEN '${fDesde}' AND '${fHasta}' `;

    let grupo_order = ``

    if (listaServicios != '0N' && listaSubservicios != '0N' && listaCajeros != '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, ne.eval_fecha, a.usua_codigo, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre, ne.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, a.usua_codigo, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }

    }

    if (listaServicios != '0N' && listaSubservicios != '0N' && listaCajeros === '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo, ne.eval_fecha, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre, ne.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo, ss.nombre, ss.id
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }
    }

    if (listaServicios != '0N' && listaSubservicios === '0N' && listaCajeros != '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, ne.eval_fecha, a.usua_codigo
            ORDER BY 
              s.serv_nombre, ne.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              s.serv_nombre, s.serv_codigo, a.usua_codigo
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }
    }

    if (listaServicios != '0N' && listaSubservicios === '0N' && listaCajeros === '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo, ne.eval_fecha
            ORDER BY 
              s.serv_nombre, ne.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, s.serv_nombre, s.serv_codigo
            ORDER BY 
              s.serv_nombre DESC;
          `;
      }
    }

    if (listaServicios === '0N' && listaSubservicios === '0N' && listaCajeros != '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, ne.eval_fecha, a.usua_codigo
            ORDER BY 
              ne.eval_fecha DESC;
            `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, a.usua_codigo
            ORDER BY 
              e.empr_nombre DESC;
          `;
      }
    }

    if (listaServicios === '0N' && listaSubservicios === '0N' && listaCajeros === '0N') {
      if (verFecha === true) {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre, ne.eval_fecha
            ORDER BY 
              ne.eval_fecha DESC;
          `;
      }
      else {
        grupo_order +=
          `      
            GROUP BY 
              e.empr_nombre
            ORDER BY 
              e.empr_nombre DESC;
          `;
      }
    }

    let consulta =
      `
      SELECT 
        ${columnas}
      FROM 
        usuarios a
      INNER JOIN noevaluacion ne ON a.usua_codigo = ne.usua_codigo
      INNER JOIN cajero c ON c.usua_codigo = a.usua_codigo
      INNER JOIN empresa e ON e.empr_codigo = a.empr_codigo
      INNER JOIN turno t ON t.turn_codigo = ne.turn_codigo
      INNER JOIN servicio s ON s.serv_codigo = t.serv_codigo
      INNER JOIN sub_servicio ss ON ss.id = t.id_sub_serv
      ${filtros}
      ${grupo_order}
      `;
    console.log('consulta ', consulta)

    query = consulta

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




router.get("/getallservicios/:sucursales", TokenValidation, (req: Request, res: Response) => {
  const listaSucursales = req.params.sucursales;
  const sucursalesArray = listaSucursales.split(",");

  let todasSucursales = false;

  if (sucursalesArray.includes("-1")) {
    todasSucursales = true;
  }

  const query =
    `
      SELECT 
        s.*, 
        ss.*, 
        e.empr_nombre AS empresa 
      FROM 
        servicio s
      INNER JOIN sub_servicio ss ON ss.id_servicio = s.serv_codigo
      INNER JOIN empresa e ON s.empr_codigo = e.empr_codigo
      WHERE 
        s.serv_codigo != 1
        ${!todasSucursales ? `AND s.empr_codigo IN (${listaSucursales})` : ''}
      ORDER BY 
        s.serv_nombre ASC;
    `;

  MySQL.ejecutarQuery(query, (err: any, servicios: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
    } else {
      res.json({
        ok: true,
        servicios,
      });
    }
  });
});



// METODO PARA BUSCAR SUBSERVICIOS DE ACUERDO AL SERVICIO SELECCIONADO
router.get("/getallSubservicios/:servicio", TokenValidation, (req: Request, res: Response) => {
  // FILTRO SERVICIOS
  const listaServicios = req.params.servicio;
  const serviciosArray = listaServicios.split(",");
  let todosServicios = false;
  // VALIDACION SERVICIOS
  if (serviciosArray.includes("-1")) {
    todosServicios = true;
  }

  const query =
    `
      SELECT 
        s.serv_codigo, s.serv_nombre, ss.id, ss.nombre
      FROM 
        servicio AS s
      INNER JOIN sub_servicio AS ss ON ss.id_servicio = s.serv_codigo
      WHERE 
        s.serv_codigo != 1
        ${!todosServicios ? `AND s.serv_codigo IN (${listaServicios})` : ''}
      ORDER BY 
        s.serv_nombre ASC;
    `;

  MySQL.ejecutarQuery(query, (err: any, servicios: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
    } else {
      res.json({
        ok: true,
        servicios,
      });
    }
  });
});


/** ************************************************************************************************************ **
 ** **                                           EMPLEADO                                                     ** **
 ** ************************************************************************************************************ **/

router.get(
  "/evaluacion/turnos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:servicios/:subservicios/:cajeros/:estado/:opciones", TokenValidation,
  (req: Request, res: Response) => {

    // VARIABLES DE FECHAS
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    // VARIABLES DE HORAS
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    let diaCompleto = false;
    let hFinAux = 0;
    // VARIBALE DE OPCIONES DE BOTONES (TRUE -> 4 -- FALSE -> 5)
    const opcion = req.params.opcion;
    let opciones = false;
    // VARIABLE DE ESTADO DEL USUARIO
    const estado = req.params.estado;
    let estadoUsuario = false;
    // FILTROS DE SUCURSALES
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    // FILTROS DE SERVICIOS
    const listaServicios: any = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    let todosServicios = false;
    // FILTROS DE CAJEROS
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    let todosCajeros = false;
    // FILTROS DE SUBSERVICIOS
    const listaSubservicios = req.params.subservicios;
    const subserviciosArray = listaSubservicios.split(",");
    let todosSubservicios = false;

    // VALIDACION DE SUCURSALES
    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }
    // VALIDACION DE SERVICIOS
    if (serviciosArray.includes("-1")) {
      todosServicios = true
    }
    // VALIDACION DE CAJEROS
    if (cajerosArray.includes("-1")) {
      todosCajeros = true
    }
    // VALIDACION DE SUBSERVICIOS
    if (subserviciosArray.includes("-1")) {
      todosSubservicios = true
    }
    // VALIDACION DE HORAS
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }
    // VALIDACION DE OPCIONES
    if (opcion == "true") {
      opciones = true;
    }

    let query;

    // CREAR SQL DE ACUERDO A LAS VALIDACIONES
    let columnas =
      `
        e.empr_nombre AS nombreEmpresa,
      `;

    if (listaCajeros != '0N') {
      columnas += `a.usua_nombre,`;
      estadoUsuario = true;
    }

    if (listaServicios != '0N') {
      columnas +=
        `
          s.serv_nombre AS servicio, 
          s.serv_descripcion AS sigla_servicio,
        `;
    }
    if (listaSubservicios != '0N') {
      columnas +=
        `
        ss.nombre AS subservicio,
        ss.siglas AS sigla_subservicio,
        `;
    }

    columnas +=
      `
        ct.nombre AS nombre_cliente,
        ct.cedula AS cedula_cliente,
        ct.otro AS informacion_cliente,
        DATE_FORMAT(f.eval_fecha, '%Y-%m-%d') AS fecha,
        f.eval_hora,
        f.eval_minuto,
        t.turn_numero,
        (SELECT 
          CONCAT(LEFT(st.serv_descripcion, 3), LPAD(ts.turn_numero, 3, '0'))
        FROM servicio st
        JOIN turno ts ON ts.serv_codigo = st.serv_codigo
        WHERE ts.turn_codigo = t.turn_codigo
        LIMIT 1) AS turno_servicio,
        (SELECT 
          CONCAT(LEFT(sst.siglas, 3), LPAD(ts.turn_numero, 3, '0'))
        FROM sub_servicio sst
        JOIN turno ts ON ts.id_sub_serv = sst.id
        WHERE ts.turn_codigo = t.turn_codigo
        LIMIT 1) AS turno_subservicio,
        f.eval_califica,
      `;

    if (opciones) {
      columnas +=
        `
          CASE 
            WHEN f.eval_califica = 40 THEN 'Excelente'
        `;
    } else {
      columnas +=
        `
          CASE 
            WHEN f.eval_califica = 50 THEN 'Excelente'
            WHEN f.eval_califica = 40 THEN 'Muy bueno'
        `;
    }

    columnas +=
      `
        WHEN f.eval_califica = 30 THEN 'Bueno'
        WHEN f.eval_califica = 20 THEN 'Regular'
        WHEN f.eval_califica = 10 THEN 'Malo'
        ELSE 'Sin calificación'
        END AS calificacion
      `;


    let filtros =
      `
        WHERE a.usua_codigo = f.usua_codigo 
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo != 2 
      `;

    if (!estadoUsuario) filtros += ` AND a.usua_codigo = c.usua_codigo `;

    (estado != '3')? filtros += ` AND c.caje_estado = ${estado}`: '';

    if (!todasSucursales) filtros += ` AND a.empr_codigo IN (${listaSucursales}) `;
    if (listaServicios != '0N') {
      if (!todosServicios) filtros += ` AND s.serv_codigo IN (${listaServicios}) `;
    }
    if (listaSubservicios != '0N') {
      if (!todosSubservicios) filtros += ` AND ss.id IN (${listaSubservicios}) `;
    }
    if (listaCajeros != '0N') {
      if (!todosCajeros) filtros += ` AND a.usua_codigo IN (${listaCajeros}) `;
    }
    if (!diaCompleto) filtros += ` AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' `;
    filtros += ` AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' `;

    let consulta =
      `
        SELECT 
          ${columnas}
        FROM 
          usuarios a
          JOIN evaluacion f ON a.usua_codigo = f.usua_codigo
          JOIN empresa e ON e.empr_codigo = a.empr_codigo
         JOIN cajero c ON c.usua_codigo = a.usua_codigo
          JOIN turno t ON f.turn_codigo = t.turn_codigo
          JOIN servicio s ON s.serv_codigo = t.serv_codigo
          JOIN sub_servicio ss ON ss.id = t.id_sub_serv
          JOIN cliente_turno ct ON ct.turn_codigo = t.turn_codigo
        ${filtros}
        ORDER BY f.eval_fecha DESC;
      `;

    console.log('consulta1 ', consulta)

    query = consulta

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
  "/evaluacion/omitidos/turnos/:fechaDesde/:fechaHasta/:horaInicio/:horaFin/:sucursales/:servicios/:subservicios/:cajeros/:estado", TokenValidation,
  (req: Request, res: Response) => {

    // VARIABLES DE FECHAS
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    // VARIABLES DE HORAS
    const hInicio = req.params.horaInicio;
    const hFin = req.params.horaFin;
    let diaCompleto = false;
    let hFinAux = 0;
    // VARIABLE DE ESTADO DEL USUARIO
    const estado = req.params.estado;
    let estadoUsuario = false;
    // FILTROS DE SUCURSALES
    const listaSucursales = req.params.sucursales;
    const sucursalesArray = listaSucursales.split(",");
    let todasSucursales = false;
    // FILTROS DE SERVICIOS
    const listaServicios: any = req.params.servicios;
    const serviciosArray = listaServicios.split(",");
    let todosServicios = false;
    // FILTROS DE CAJEROS
    const listaCajeros = req.params.cajeros;
    const cajerosArray = listaCajeros.split(",");
    let todosCajeros = false;
    // FILTROS DE SUBSERVICIOS
    const listaSubservicios = req.params.subservicios;
    const subserviciosArray = listaSubservicios.split(",");
    let todosSubservicios = false;

    // VALIDACION DE SUCURSALES
    if (sucursalesArray.includes("-1")) {
      todasSucursales = true
    }
    // VALIDACION DE SERVICIOS
    if (serviciosArray.includes("-1")) {
      todosServicios = true
    }
    // VALIDACION DE CAJEROS
    if (cajerosArray.includes("-1")) {
      todosCajeros = true
    }
    // VALIDACION DE SUBSERVICIOS
    if (subserviciosArray.includes("-1")) {
      todosSubservicios = true
    }
    // VALIDACION DE HORAS
    if ((hInicio == "-1") || (hFin == "-1") || (parseInt(hInicio) > parseInt(hFin))) {
      diaCompleto = true;
    } else {
      hFinAux = parseInt(hFin) - 1;
    }

    let query;

    // CREAR SQL DE ACUERDO A LAS VALIDACIONES
    let columnas =
      `
        e.empr_nombre AS nombreEmpresa,
      `;

    if (listaCajeros != '0N') {
      columnas += `a.usua_nombre,`;
      estadoUsuario = true;
    }

    if (listaServicios != '0N') {
      columnas +=
        `
          s.serv_nombre AS servicio, 
          s.serv_descripcion AS sigla_servicio,
        `;
    }
    if (listaSubservicios != '0N') {
      columnas +=
        `
        ss.nombre AS subservicio,
        ss.siglas AS sigla_subservicio,
        `;
    }

    columnas +=
      `
	      null AS nombre_cliente,
        null AS cedula_cliente,
        null AS informacion_cliente,
        DATE_FORMAT(ne.eval_fecha, '%Y-%m-%d') AS fecha,
        ne.eval_hora,
        ne.eval_minuto,
        t.turn_numero,
        (SELECT 
          CONCAT(LEFT(st.serv_descripcion, 3), LPAD(ts.turn_numero, 3, '0'))
        FROM servicio st
        JOIN turno ts ON ts.serv_codigo = st.serv_codigo
        WHERE ts.turn_codigo = t.turn_codigo
        LIMIT 1) AS turno_servicio,
        (SELECT 
          CONCAT(LEFT(sst.siglas, 3), LPAD(ts.turn_numero, 3, '0'))
        FROM sub_servicio sst
        JOIN turno ts ON ts.id_sub_serv = sst.id
        WHERE ts.turn_codigo = t.turn_codigo
        LIMIT 1) AS turno_subservicio,
        ne.eval_califica,
        CASE 
          WHEN ne.eval_califica = 1 THEN 'Omitida'
          ELSE 'Sin calificación'
        END AS calificacion
      `;

    let filtros =
      `
        WHERE ne.turn_codigo = t.turn_codigo
        AND e.empr_codigo = a.empr_codigo
        AND a.usua_codigo != 2 
      `;

    if (!estadoUsuario) filtros += ` AND a.usua_codigo = c.usua_codigo  `;
    (estado != '3')? filtros += ` AND c.caje_estado = ${estado}`: '';


    if (!todasSucursales) filtros += ` AND a.empr_codigo IN (${listaSucursales}) `;
    if (listaServicios != '0N') {
      if (!todosServicios) filtros += ` AND s.serv_codigo IN (${listaServicios}) `;
    }
    if (listaSubservicios != '0N') {
      if (!todosSubservicios) filtros += ` AND ss.id IN (${listaSubservicios}) `;
    }
    if (listaCajeros != '0N') {
      if (!todosCajeros) filtros += ` AND a.usua_codigo IN (${listaCajeros}) `;
    }
    if (!diaCompleto) filtros += ` AND t.turn_hora BETWEEN '${hInicio}' AND '${hFinAux}' `;
    filtros += ` AND t.turn_fecha BETWEEN '${fDesde}' AND '${fHasta}' `;

    let consulta =
      `
        SELECT 
          ${columnas}
        FROM 
          usuarios a
          JOIN empresa e ON e.empr_codigo = a.empr_codigo
          JOIN cajero c ON c.usua_codigo = a.usua_codigo
          JOIN noevaluacion ne ON ne.usua_codigo = a.usua_codigo
          JOIN turno t ON ne.turn_codigo = t.turn_codigo
          JOIN servicio s ON s.serv_codigo = t.serv_codigo
          JOIN sub_servicio ss ON ss.id = t.id_sub_serv
        ${filtros}
        ORDER BY ne.eval_fecha DESC;
      `;

    query = consulta

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
 ** **                                              GRAFICOS                                                  ** **
 ** ************************************************************************************************************ **/

router.get("/graficobarras/:opcion", TokenValidation, (req: Request, res: Response) => {
  const opcion = req.params.opcion;
  let query;

  if (opcion == "true") {
    query =
      `
        SELECT 
          eval_califica, 
          COUNT(eval_califica) AS total,
          IF((eval_califica) = 40, 'Excelente',
          IF((eval_califica) >= 30, 'Bueno',
          IF((eval_califica) >= 20, 'Regular',
          IF((eval_califica) >= 10, 'Malo', 'No existe')))) AS evaluacion,
		      ROUND((COUNT(eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c 
                                            FROM evaluacion, usuarios 
                                            WHERE evaluacion.usua_codigo = usuarios.usua_codigo 
                                              AND eval_califica != 50
                                              AND usuarios.usua_codigo != 2
                                            GROUP BY eval_califica)as tl),2) AS porcentaje
        FROM evaluacion, usuarios 
        WHERE evaluacion.usua_codigo = usuarios.usua_codigo
          AND eval_califica != 50
          AND usuarios.usua_codigo != 2
        GROUP BY eval_califica ORDER BY eval_califica DESC;
      `;
  } else {
    query =
      `
        SELECT 
          eval_califica, 
          COUNT(eval_califica) AS total,
          IF((eval_califica) = 50, 'Excelente',
          IF((eval_califica) >= 40, 'Muy Bueno',
          IF((eval_califica) >= 30, 'Bueno',
          IF((eval_califica) >= 20, 'Regular',
          IF((eval_califica) >= 10, 'Malo', 'No existe'))))) AS evaluacion,
		      ROUND((COUNT(eval_califica)*100)/(SELECT SUM(c) FROM (SELECT COUNT(eval_califica) AS c 
                                                                FROM evaluacion, usuarios 
                                                                WHERE evaluacion.usua_codigo = usuarios.usua_codigo
                                                                  AND usuarios.usua_codigo != 2 
                                                                GROUP BY eval_califica)as tl),2
                                                          ) AS porcentaje
          FROM evaluacion, usuarios 
          WHERE evaluacion.usua_codigo = usuarios.usua_codigo
            AND usuarios.usua_codigo != 2
          GROUP BY eval_califica ORDER BY eval_califica DESC;
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
});

/** ************************************************************************************************************ **
 ** **                                       EVALUACION POR GRUPOS                                            ** **
 ** ************************************************************************************************************ **/

router.get("/opcionesEvaluacion", TokenValidation, (req: Request, res: Response) => {
  const query =
    `
      SELECT * FROM general;
    `;

  MySQL.ejecutarQuery(query, (err: any, opcion: Object[]) => {
    if (err) {
      res.status(400).json({
        ok: false,
        error: err,
      });
    } else {
      res.json({
        ok: true,
        opcion: opcion,
      });
    }
  });
});

export default router;
