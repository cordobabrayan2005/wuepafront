/* Este fragmento de código importa los módulos y componentes necesarios para una aplicación React con TypeScript.
A continuación se explica cada importación: */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.scss";

/* Este fragmento utiliza la API experimental createRoot de ReactDOM para renderizar la aplicación React.
Descripción de lo que realiza: */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
