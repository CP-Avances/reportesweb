
import mysql = require('mysql');


export default class MySQL {

    private static _instance: MySQL;

    cnn: mysql.Connection;
    conectado: boolean = false;


    constructor() {
        console.log('clase inicializada');

        this.cnn = mysql.createConnection({
            host: '192.168.1.11',
            port: 3307,
            user: 'root',
            password: 'root',
            database: 'fulltimetickets'
        });

        this.conectarDB();
    }

    ///////
    //obtener la isntancia
    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    ////
    ////
    //ejecutar query
    static ejecutarQuery(query: string, callback: Function) {

        this.instance.cnn.query(query, (err: any, results: Object[]) => {
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
        })

    }
    ////


    private conectarDB() {
        this.cnn.connect((err) => {
            if (err) {
                console.log('Base de datos no conecta!! : ' + JSON.stringify(err, undefined, 2));
                return;
            }
            this.conectado = true;
            console.log('Base de datos online!!');
        })
    }




}


