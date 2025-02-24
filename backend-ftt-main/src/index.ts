require('dotenv').config();
import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';

import router from './router/router';
import usuarios from './router/usuarios';
import evaluacion from './router/evaluacion';
import satisfacciones from './router/satisfaccion'
import disestadoturno from './router/disestadoturno';
import opinion from './router/opinion';

import { createServer, Server } from 'http';

class Servidor {

    public app: Application;
    public server: Server;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.configuracion();
        this.rutas();
        this.server = createServer(this.app);

    }

    configuracion(): void {
        this.app.set('puerto', process.env.PORT || 3004);
        this.app.use(morgan('dev'));
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
        this.app.use(express.raw({ type: 'image/*', limit: '2Mb' }));
        this.app.use(express.static('imagenesReportes'));
        this.app.set('trust proxy', true);
        this.app.get('/', (req, res) => {
            res.status(200).json({
                status: 'success'
            });
        });
    }

    rutas(): void {
        // LLAMAR RUTAS
        this.app.use(router);
        this.app.use(usuarios);
        this.app.use(evaluacion);
        this.app.use(satisfacciones);
        this.app.use(disestadoturno);
        this.app.use(opinion);
    }
    
    start(): void {
        this.app.set('trust proxy', true);
        this.server.listen(this.app.get('puerto'), () => {
            console.log('Servidor en el puerto', this.app.get('puerto'));
        });
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        })
    }
}

const SERVIDOR = new Servidor();
SERVIDOR.start();