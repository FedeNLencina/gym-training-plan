import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './estilos/variables.css';
import './estilos/global.css';
import './estilos/components.css';

const contenedorRaiz = document.getElementById('root');

if (contenedorRaiz === null) {
  throw new Error('No se encontró el elemento con id "root" en el documento.');
}

ReactDOM.createRoot(contenedorRaiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
