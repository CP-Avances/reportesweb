"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenValidation = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const TokenValidation = (req, res, next) => {
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
    }
    catch (error) {
        // Si el token no es válido, responder con un error 401 (no autorizado)
        return res.status(401).json({ message: 'Token de autorización no válido' });
    }
};
exports.TokenValidation = TokenValidation;
