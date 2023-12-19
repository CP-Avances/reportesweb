import Server from './server/server';
import router from './router/router';

import usuarios from './router/usuarios';
import evaluacion from './router/evaluacion';
import atencion from './router/atencion';
import ocupacion from './router/ocupacion';
import satisfacciones from './router/satisfaccion'
import disestadoturno from './router/disestadoturno';
import ingresoclientes from './router/ingresoclientes';
import atendidosmultiples from './router/atendidosmultiples';
import opinion from './router/opinion';

import express = require('express');

// PUERTO 3004 -- DESARROLLO -- 3005 -- PRODUCCION
const server = Server.init(process.env.PORT || 3004);

const port = process.env.PORT || 3004;

// LLAMAR RUTAS
server.app.use(router);
server.app.use(usuarios);
server.app.use(evaluacion);
server.app.use(atencion);
server.app.use(satisfacciones);
server.app.use(ocupacion);
server.app.use(disestadoturno);
server.app.use(ingresoclientes);
server.app.use(atendidosmultiples);
server.app.use(opinion);

server.app.use(express.urlencoded({extended: false}));
server.app.use(express.json());

server.start( () => {
    console.log(`servidor corriendo en el puerto ${port}`);
})