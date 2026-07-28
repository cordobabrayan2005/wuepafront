import React from 'react';

type AppErrorBoundaryState = {
  hasError: boolean;
};

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error) {
    console.error('App render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-state">
          <div className="app-error-card">
            <p className="app-error-kicker">Error de interfaz</p>
            <h1>No se pudo cargar la página</h1>
            <p>No pudimos mostrar esta sección en este momento. Intenta recargar la página o vuelve al inicio.</p>
            <button type="button" className="btn-primary" onClick={() => window.location.assign('/')}>
              Volver al inicio
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
