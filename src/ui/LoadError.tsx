import { Component, type ReactNode } from 'react'

/**
 * Si el modelo no se puede descargar, React Three Fiber relanza el error fuera del <Canvas>. Sin esta
 * frontera, la página quedaría en blanco; con ella se explica qué pasó y se ofrece reintentar.
 */
export class LoadError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="overlay">
        <div className="loader" role="alert">
          <div className="loader__card">
            <p className="loader__title">No se pudo cargar el cuarto.</p>
            <p className="loader__hint">Revisa tu conexión e inténtalo de nuevo.</p>
            <button type="button" className="back-button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }
}
