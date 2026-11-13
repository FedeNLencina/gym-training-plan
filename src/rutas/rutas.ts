export const RUTAS = {
  inicio: '/',
  planes: '/planes',
  entrenamientos: '/entrenamientos',
  entrenamiento: (id: string): string => `/entrenamientos/${id}`,
  ingresar: '/ingresar',
  registro: '/registro',
  admin: '/admin',
} as const;
