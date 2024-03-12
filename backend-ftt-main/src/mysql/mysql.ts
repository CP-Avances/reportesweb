
import mysql = require('mysql2');


export default class MySQL {

    private static _instance: MySQL;

    cnn: any;
    conectado: boolean = false;

    constructor() {
        console.log('clase inicializada');

        this.cnn = mysql.createPool({
            host: '192.168.0.145',
            port: 3307,
            user: 'fte',
            password: 'admin123',
            database: 'fiscalia2',
            connectionLimit: 10,
        });

        this.conectarDB();
    }

    // OBTENER LA ISNTANCIA
    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    // EJECUTAR QUERY
    static ejecutarQuery(query: string, callback: Function) {

        this.instance.cnn.query(query, (err: any, results: Object[]) => {
            if (err) {
                console.log(err);
                return callback(err);
            }

            if (results.length === 0) {
                callback('El registro solicitado no existe');
                return;
            }
            callback(null, results);
        })

    }

    private conectarDB() {
        this.cnn.query('SELECT 1', (err: any, results: any) => {
            if (err) {
                console.log('Base de datos no conecta!! : ' + JSON.stringify(err, undefined, 2));
                return;
            }
            this.conectado = true;
            console.log('Base de datos online!!');
        });
    }




}


