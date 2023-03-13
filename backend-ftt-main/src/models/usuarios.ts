import { Empresa } from './empresa';

export interface Usuario{
    empr_codigo: number,
    usua_nombre: string,
    usua_login: string,
    usua_password: string,
    usua_estado: number,
    usua_tipo: number
}

