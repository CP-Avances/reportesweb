"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server/server"));
const router_1 = __importDefault(require("./router/router"));
////////////
const usuarios_1 = __importDefault(require("./router/usuarios"));
const evaluacion_1 = __importDefault(require("./router/evaluacion"));
const atencion_1 = __importDefault(require("./router/atencion"));
const ocupacion_1 = __importDefault(require("./router/ocupacion"));
const satisfaccion_1 = __importDefault(require("./router/satisfaccion"));
const disestadoturno_1 = __importDefault(require("./router/disestadoturno"));
const ingresoclientes_1 = __importDefault(require("./router/ingresoclientes"));
const atendidosmultiples_1 = __importDefault(require("./router/atendidosmultiples"));
const opinion_1 = __importDefault(require("./router/opinion"));
////////////
const express = require("express");
//////
const server = server_1.default.init(process.env.PORT || 3000);
//////
const port = process.env.PORT || 3000;
//llamar rutas
server.app.use(router_1.default);
server.app.use(usuarios_1.default);
server.app.use(evaluacion_1.default);
server.app.use(atencion_1.default);
server.app.use(satisfaccion_1.default);
server.app.use(ocupacion_1.default);
server.app.use(disestadoturno_1.default);
server.app.use(ingresoclientes_1.default);
server.app.use(atendidosmultiples_1.default);
server.app.use(opinion_1.default);
server.app.use(express.urlencoded({ extended: false }));
server.app.use(express.json());
server.start(() => {
    console.log(`servidor corriendo en el puerto ${port}`);
});
