import cors from 'cors';
import express = require('express');

export default class Server {
    public app: express.Application;
    public port: string | number = process.env.PORT || 3001;

    constructor(puerto: string | number) {
        this.port = puerto;
        this.app = express();
        this.app.use(cors());
    }

    static init(puerto: string | number) {
        return new Server(puerto);
    }

    start(callback: () => void) {
        this.app.listen(this.port, callback);
    }

}