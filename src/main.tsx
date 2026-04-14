import React from "react";
import ReactDOM from "react-dom/client";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontro el nodo raiz de la aplicacion.");
}

const root = ReactDOM.createRoot(rootElement);

function renderBootstrapError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido al iniciar la aplicacion.";

  root.render(
    <React.StrictMode>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#fff8ec",
          color: "#2d2a25",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <section
          style={{
            width: "min(100%, 640px)",
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #f1dfbd",
            borderRadius: "24px",
            padding: "2rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ margin: 0, color: "#b37716", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.82rem" }}>
            Error de inicio
          </p>
          <h1 style={{ margin: "0.5rem 0 0.75rem" }}>La aplicacion no pudo cargar</h1>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{message}</p>
        </section>
      </main>
    </React.StrictMode>
  );
}

window.addEventListener("error", (event) => {
  renderBootstrapError(event.error ?? new Error(event.message || "Error inesperado en tiempo de ejecucion."));
});

window.addEventListener("unhandledrejection", (event) => {
  renderBootstrapError(event.reason);
});

Promise.all([import("./styles.scss"), import("./App")])
  .then(([, appModule]) => {
    const App = appModule.default;

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error("Bootstrap error:", error);
    renderBootstrapError(error);
  });
