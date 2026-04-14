import React from 'react';

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocurrio un error inesperado al renderizar la aplicacion.',
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
            <h1>No se pudo cargar la pagina</h1>
            <p>{this.state.errorMessage}</p>
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