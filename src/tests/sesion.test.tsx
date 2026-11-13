import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CONTRASENIA_PRUEBA } from '../datos/semilla';
import { ADMIN, ANA, montarApp } from './montar';

const barra = () => within(screen.getByRole('banner'));

describe('barra de navegación', () => {
  it('sin sesión ofrece iniciar sesión y registrarse', () => {
    montarApp('/');
    expect(barra().getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(barra().getByRole('link', { name: 'Registrarme' })).toBeInTheDocument();
    expect(barra().queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });

  it('con sesión muestra el nombre y cambia registrarse por cerrar sesión', () => {
    montarApp('/', { sesion: ANA });
    expect(barra().getByText('Ana Pérez')).toBeInTheDocument();
    expect(barra().getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
    expect(barra().queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument();
    expect(barra().queryByRole('link', { name: 'Registrarme' })).not.toBeInTheDocument();
  });

  it('al cerrar sesión vuelven los botones de acceso', async () => {
    const user = userEvent.setup();
    montarApp('/entrenamientos', { sesion: ANA });
    await user.click(barra().getByRole('button', { name: 'Cerrar sesión' }));
    expect(barra().getByRole('link', { name: 'Registrarme' })).toBeInTheDocument();
    expect(barra().queryByText('Ana Pérez')).not.toBeInTheDocument();
  });

  it('el enlace de administración sólo aparece para el administrador', () => {
    montarApp('/', { sesion: ADMIN });
    expect(barra().getByRole('link', { name: 'Administración' })).toBeInTheDocument();
  });
});

describe('acceso', () => {
  it('entrenamientos sin sesión lleva a iniciar sesión y, al ingresar, vuelve', async () => {
    const user = userEvent.setup();
    montarApp('/entrenamientos');
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Correo'), ANA);
    await user.type(screen.getByLabelText('Contraseña'), CONTRASENIA_PRUEBA);
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Entrenamientos' })).toBeInTheDocument();
    expect(barra().getByText('Ana Pérez')).toBeInTheDocument();
  });

  it('con credenciales incorrectas avisa, conserva el correo y vacía la contraseña', async () => {
    const user = userEvent.setup();
    montarApp('/ingresar');
    await user.type(screen.getByLabelText('Correo'), ANA);
    await user.type(screen.getByLabelText('Contraseña'), 'otra-clave');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Credenciales incorrectas');
    expect(screen.getByLabelText('Correo')).toHaveValue(ANA);
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('si el usuario no existe lo avisa y vacía el correo y la contraseña', async () => {
    const user = userEvent.setup();
    montarApp('/ingresar');
    await user.type(screen.getByLabelText('Correo'), 'nadie@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('alert')).toHaveTextContent('No existe el usuario');
    expect(screen.getByLabelText('Correo')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(barra().getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('el registro abre la sesión con el nombre ingresado', async () => {
    const user = userEvent.setup();
    montarApp('/registro');
    await user.type(screen.getByLabelText('Nombre'), 'Elena Ruiz');
    await user.type(screen.getByLabelText('Correo'), 'elena@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Registrarme' }));

    expect(barra().getByText('Elena Ruiz')).toBeInTheDocument();
  });

  it('el registro señala los campos inválidos y un correo ya usado', async () => {
    const user = userEvent.setup();
    montarApp('/registro');
    await user.click(screen.getByRole('button', { name: 'Registrarme' }));
    expect(screen.getByLabelText('Nombre')).toHaveAccessibleDescription('Ingresá tu nombre');

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Correo'), ANA);
    await user.type(screen.getByLabelText('Contraseña'), 'clave-segura');
    await user.click(screen.getByRole('button', { name: 'Registrarme' }));
    expect(screen.getByRole('alert')).toHaveTextContent('El correo ya está registrado');
  });

  it('un usuario común no entra al panel de administración', () => {
    montarApp('/admin', { sesion: ANA });
    expect(screen.queryByRole('heading', { name: 'Administración' })).not.toBeInTheDocument();
  });
});
