"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql2");
class MySQL {
    constructor() {
        this.conectado = false;
        console.log('clase inicializada');
        this.cnn = mysql.createPool({
            host: '192.168.0.145',
            port: 3307,
            user: 'fte',
            password: 'admin123',
            database: 'fiscalia_quevedo',
            connectionLimit: 10,
        });
        this.conectarDB();
    }
    // OBTENER LA ISNTANCIA
    static get instance() {
        return this._instance || (this._instance = new this());
    }
    // EJECUTAR QUERY
    static ejecutarQuery(query, callback) {
        this.instance.cnn.query(query, (err, results) => {
            if (err) {
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
    conectarDB() {
        this.cnn.query('SELECT 1', (err, results) => {
            if (err) {
                console.log('Base de datos no conecta!! : ' + JSON.stringify(err, undefined, 2));
                return;
            }
            this.conectado = true;
            console.log('Base de datos online!!');
        });
    }
}
exports.default = MySQL;
