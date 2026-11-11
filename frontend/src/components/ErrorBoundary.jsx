import { Component } from 'react'

/**
 * Évite la « page blanche » : si un écran plante, on affiche l'erreur
 * (utile pour le débogage) au lieu de vider toute l'application.
 * La clé `resetKey` (l'URL courante) remet le composant à zéro à chaque navigation.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erreur d\'affichage :', error, info?.componentStack)
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="container-page py-16 text-center">
        <p className="text-5xl">😕</p>
        <h1 className="mt-4 text-2xl font-bold">Cette page n'a pas pu s'afficher</h1>
        <p className="mt-2 text-slate-500">Rechargez la page. Si le problème continue, transmettez ce message à l'équipe technique :</p>
        <pre className="mx-auto mt-4 max-w-2xl overflow-x-auto rounded-xl bg-red-50 p-4 text-left text-xs text-red-700">{String(this.state.error?.message || this.state.error)}</pre>
        <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Recharger</button>
      </div>
    )
  }
}