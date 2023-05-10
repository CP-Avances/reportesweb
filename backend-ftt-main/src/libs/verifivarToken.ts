// IMPORTAR LOS MÓDULOS NECESARIOS, COMO EXPRESS Y JSONWEBTOKEN
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export const TokenValidation = (req: Request, res: Response, next: NextFunction) => {
   // VERIFICA SI EN LA PETICION EXISTE LA CABECERA AUTORIZACION 
   if (!req.headers.authorization) {
    return res.status(401).send('Permiso denegado.');
    }
   // VERIFICAR SI EL TOKEN JWT ESTÁ PRESENTE EN LA SOLICITUD
   const token = req.headers.authorization.split(' ')[1];
   if (token === 'null') {
     // SI NO SE PROPORCIONA UN TOKEN, RESPONDER CON UN ERROR 401 (NO AUTORIZADO)
     console.log("validacion");
     return res.status(401).json({ message: 'No contienen token de autenticación.' });
   }
 
   try {
     // VERIFICAR LA VALIDEZ DEL TOKEN JWT
     const decodedToken = jwt.verify(token, 'llaveSecreta');
     // AGREGAR LOS DATOS DECODIFICADOS DEL TOKEN A LA SOLICITUD PARA SU POSTERIOR USO
     // PERMITIR QUE LA SOLICITUD CONTINUE
     next();
   } catch (error) {
     // Si el token no es válido, responder con un error 401 (no autorizado)
     return res.status(401).json({ message: 'Token de autorización no válido' });
   }
 
}

