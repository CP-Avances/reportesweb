"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
class MySQL {
    constructor() {
        this.conectado = false;
        console.log('clase inicializada');
        this.cnn = mysql.createConnection({
            //  host: '172.107.32.118',
            // port: 15178,
            // user: 'peterprueba',
            // password: 'peterprueba/23',
            // database: 'fulltimetickets3'
            host: 'localhost',
            //host: '192.168.0.122',
            user: 'root',
            password: 'Ec170150',
            database: 'fulltimetickets'
        });
        this.conectarDB();
    }
    ///////
    //obtener la isntancia
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    ////
    ////
    //ejecutar query
    static ejecutarQuery(query, callback) {
        this.instance.cnn.query(query, (err, results, fields) => {
            if (err) {
                console.log('error en query');
                console.log(err);
                return callback(err);
            }
            if (results.length === 0) {
                callback('El registro solicitado no existe');
                return;
            }
            callback(null, results);
        });
    }
    ////
    conectarDB() {
        this.cnn.connect((err) => {
            if (err) {
                console.log(err.message);
                return;
            }
            this.conectado = true;
            console.log('Base de datos online!!');
        });
    }
}
exports.default = MySQL;
