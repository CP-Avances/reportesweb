"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const router_1 = __importDefault(require("./router/router"));
const usuarios_1 = __importDefault(require("./router/usuarios"));
const evaluacion_1 = __importDefault(require("./router/evaluacion"));
const atencion_1 = __importDefault(require("./router/atencion"));
const ocupacion_1 = __importDefault(require("./router/ocupacion"));
const satisfaccion_1 = __importDefault(require("./router/satisfaccion"));
const disestadoturno_1 = __importDefault(require("./router/disestadoturno"));
const ingresoclientes_1 = __importDefault(require("./router/ingresoclientes"));
const atendidosmultiples_1 = __importDefault(require("./router/atendidosmultiples"));
const opinion_1 = __importDefault(require("./router/opinion"));
const http_1 = require("http");
class Servidor {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
        this.configuracion();
        this.rutas();
        this.server = (0, http_1.createServer)(this.app);
    }
    configuracion() {
        this.app.set('puerto', process.env.PORT || 3004);
        this.app.use((0, morgan_1.default)('dev'));
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
        this.app.use(express_1.default.raw({ type: 'image/*', limit: '2Mb' }));
        this.app.use(express_1.default.static('imagenesReportes'));
        this.app.set('trust proxy', true);
        this.app.get('/', (req, res) => {
            res.status(200).json({
                status: 'success'
            });
        });
    }
    rutas() {
        // LLAMAR RUTAS
        this.app.use(router_1.default);
        this.app.use(usuarios_1.default);
        this.app.use(evaluacion_1.default);
        this.app.use(atencion_1.default);
        this.app.use(satisfaccion_1.default);
        this.app.use(ocupacion_1.default);
        this.app.use(disestadoturno_1.default);
        this.app.use(ingresoclientes_1.default);
        this.app.use(atendidosmultiples_1.default);
        this.app.use(opinion_1.default);
    }
    start() {
        this.app.set('trust proxy', true);
        this.server.listen(this.app.get('puerto'), () => {
            console.log('Servidor en el puerto', this.app.get('puerto'));
        });
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        });
    }
}
const SERVIDOR = new Servidor();
SERVIDOR.start();
