export class ErrorHttp extends Error {
  constructor(mensaje, codigo = 500, detalle) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.codigo = codigo;
    this.detalle = detalle;
  }
}

export const noEncontrado = (recurso) => new ErrorHttp(`${recurso} no encontrado`, 404);
