import { Router, Request, Response } from "express";
import MySQL from "../mysql/mysql";

const router = Router();

/** ************************************************************************************************************ **
 ** **                                             OPINIONES                                                  ** ** 
 ** ************************************************************************************************************ **/

router.get(
  "/opinion/:fechaDesde/:fechaHasta/:empresa",
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
      query =
        `
        SELECT quejas.emi_codigo AS quejas_emi_codigo, 
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo', 
          IF((quejas.emi_tipo = 3), 'Sugerencia', 
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo, 
          quejas.emi_categoria AS quejas_emi_categoria, 
          date_format(quejas.emi_fecha, '%Y-%m-%d') AS quejas_emi_fecha, 
          quejas.emi_hora AS quejas_emi_hora, 
          quejas.emi_minuto AS quejas_emi_minuto, 
          empresa.empr_nombre AS empresa_empr_nombre, 
          caja.caja_nombre AS caja_caja_nombre, 
          quejas.emi_queja AS quejas_emi_queja 
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo 
        INNER JOIN caja ON quejas.caja_codigo = caja.caja_codigo 
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
        ORDER BY quejas.emi_fecha DESC, quejas.emi_hora DESC, quejas.emi_minuto DESC, quejas.emi_codigo DESC;
        `
    } else {
      query =
        `
        SELECT quejas.emi_codigo AS quejas_emi_codigo, 
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo', 
          IF((quejas.emi_tipo = 3), 'Sugerencia',
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo, 
          quejas.emi_categoria AS quejas_emi_categoria, 
          date_format(quejas.emi_fecha, '%Y-%m-%d') AS quejas_emi_fecha, 
          quejas.emi_hora AS quejas_emi_hora, 
          quejas.emi_minuto AS quejas_emi_minuto, 
          empresa.empr_nombre AS empresa_empr_nombre, 
          caja.caja_nombre AS caja_caja_nombre, 
          quejas.emi_queja AS quejas_emi_queja 
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo 
        INNER JOIN caja ON quejas.caja_codigo = caja.caja_codigo 
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}' 
          AND empresa.empr_codigo = ${cEmpresa}
        ORDER BY quejas.emi_fecha DESC, quejas.emi_hora DESC, quejas.emi_minuto DESC, quejas.emi_codigo DESC;
        `
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
 ** **                                       GRAFICO OPINION                                                  ** ** 
 ** ************************************************************************************************************ **/

router.get(
  "/graficoopinion/:fechaDesde/:fechaHasta/:empresa",
  (req: Request, res: Response) => {
    const fDesde = req.params.fechaDesde;
    const fHasta = req.params.fechaHasta;
    const cEmpresa = req.params.empresa;
    let query;
    if (cEmpresa == "-1") {
      query =
        `
        SELECT COUNT(quejas.emi_tipo) AS queja_cantidad,
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo',
          IF((quejas.emi_tipo = 3), 'Sugerencia',
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo,
        empresa.empr_nombre AS empresa_empr_nombre,
        quejas.emi_categoria AS quejas_emi_categoria
        FROM empresa 
        INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}'
        GROUP BY emi_tipo, empresa.empr_nombre, quejas.emi_categoria;
        `
    } else {
      query =
        `
        SELECT COUNT(quejas.emi_tipo) AS queja_cantidad,
          IF((quejas.emi_tipo = 1), 'Queja', 
          IF((quejas.emi_tipo = 2), 'Reclamo',
          IF((quejas.emi_tipo = 3), 'Sugerencia',
          IF((quejas.emi_tipo = 4), 'Felicitaciones', 'No Existe')))) AS quejas_emi_tipo,
          empresa.empr_nombre AS empresa_empr_nombre,
          quejas.emi_categoria AS quejas_emi_categoria
        FROM empresa INNER JOIN quejas ON empresa.empr_codigo = quejas.empr_codigo
        WHERE emi_fecha BETWEEN '${fDesde}' AND '${fHasta}'
          AND empresa.empr_codigo = ${cEmpresa}
        GROUP BY emi_tipo, quejas.emi_categoria;
        `
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
