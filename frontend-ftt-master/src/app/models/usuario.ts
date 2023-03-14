export class usuario {
  constructor(
    public usua_login: string,
    public usua_password: string,
    public empr_codigo?: number,
    public usua_codigo?: number,
    public usua_nombre?: string,
    public usua_estado?: number,
    public usua_tipo?: number
  ) { }
}
