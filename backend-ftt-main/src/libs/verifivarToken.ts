// Importar los módulos necesarios, como express y jsonwebtoken
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';


export const TokenValidation = (req: Request, res: Response, next: NextFunction) => {
   // VERIFICA SI EN LA PETICION EXISTE LA CABECERA AUTORIZACION 
   if (!req.headers.authorization) {
    return res.status(401).send('Permiso denegado.');
    }
   // Verificar si el token JWT está presente en la solicitud
   const token = req.headers.authorization.split(' ')[1];
   if (token === 'null') {
     // Si no se proporciona un token, responder con un error 401 (no autorizado)
     console.log("validacion");
     return res.status(401).json({ message: 'No contienen token de autenticación.' });
   }
 
   try {
     // Verificar la validez del token JWT
     const decodedToken = jwt.verify(token, 'llaveSecreta');
     // Agregar los datos decodificados del token a la solicitud para su posterior uso
     // Permitir que la solicitud continúe
     next();
   } catch (error) {
     // Si el token no es válido, responder con un error 401 (no autorizado)
     return res.status(401).json({ message: 'Token de autorización no válido' });
   }
 
}

