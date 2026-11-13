/** Errores de dominio: su `message` está pensado para mostrarse al usuario. */

export class ErrorDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type CamposInvalidos = Readonly<Record<string, string>>;

/** Datos de formulario inválidos; `campos` indexa el mensaje por nombre de campo. */
export class ErrorValidacion extends ErrorDominio {
  readonly campos: CamposInvalidos;

  constructor(campos: CamposInvalidos) {
    super('Revisá los campos marcados');
    this.campos = campos;
  }
}

export class ErrorCredenciales extends ErrorDominio {
  constructor() {
    super('Credenciales incorrectas');
  }
}

export class ErrorUsuarioInexistente extends ErrorDominio {
  constructor() {
    super('No existe el usuario. Registrate para poder ingresar.');
  }
}

export class ErrorCorreoRegistrado extends ErrorDominio {
  constructor() {
    super('El correo ya está registrado');
  }
}

export class ErrorOperacionNoPermitida extends ErrorDominio {
  constructor(mensaje = 'No podés realizar esta operación') {
    super(mensaje);
  }
}
