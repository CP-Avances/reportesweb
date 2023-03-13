"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express = require("express");
class Server {
    //public PORT = process.env.PORT || 3000;
    //const PORT : string|number = process.env.PORT || 5000;
    constructor(puerto) {
        this.port = process.env.PORT || 3001;
        this.port = puerto;
        this.app = express();
        this.app.use(cors_1.default());
    }
    static init(puerto) {
        return new Server(puerto);
    }
    start(callback) {
        this.app.listen(this.port, callback);
    }
}
exports.default = Server;
