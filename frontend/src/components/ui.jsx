import { useState } from 'react'
import { ChevronLeft, ChevronRight, Inbox, Star, X } from 'lucide-react'

/**
 * Logo officiel Teranga Voyages.
 *  light   : version blanche pour les fonds bleus
 *  size    : 'sm' | 'md' | 'lg'
 */
export function Logo({ light = false, size = 'md', className = '' }) {
  const heights = { sm: 'h-12', md: 'h-14 sm:h-16', lg: 'h-16 sm:h-20' }
  return (
    <img
      src={light ? '/logo-teranga-white.png' : '/logo-teranga.png'}
      alt="Teranga Voyages"
      className={`${heights[size] || heights.md} w-auto max-w-full shrink-0 self-start object-contain select-none ${className}`}
      draggable="false"
    />
  )
}

/** Image avec repli élégant (dégradé bleu) si l'URL est absente ou cassée. */
export function Img({ src, alt = '', className = '', label }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-bic-500 via-bic-600 to-sky-400 ${className}`}>
        <span className="px-4 text-center text-lg font-bold text-white/90">{label || alt}</span>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}

export function Spinner({ className = '' }) {
  return <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-bic-600">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function EmptyState({ title = 'Aucun résultat', text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-14 text-center">
      <Inbox className="mb-3 h-10 w-10 text-sky-400" />
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Stars({ value = 0, size = 'h-4 w-4', showValue = false }) {
  const rounded = Math.round(Number(value) || 0)
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
      {showValue && value ? <span className="ml-1 text-sm font-semibold text-slate-700">{Number(value).toFixed(1)}</span> : null}
    </span>
  )
}

export function Badge({ className = '', children }) {
  return <span className={`badge ${className}`}>{children}</span>
}

export function StatusBadge({ map, value }) {
  const s = map[value] || { label: value, className: 'bg-slate-100 text-slate-700' }
  return <span className={`badge ${s.className}`}>{s.label}</span>
}

/** Pagination pour les réponses paginées de Laravel. */
export function Pagination({ meta, onChange }) {
  if (!meta || meta.last_page <= 1) return null
  const { current_page: page, last_page: last } = meta
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button className="btn-light btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" /> Précédent
      </button>
      <span className="px-3 text-sm text-slate-600">
        Page <strong>{page}</strong> / {last}
      </span>
      <button className="btn-light btn-sm" disabled={page >= last} onClick={() => onChange(page + 1)}>
        Suivant <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onMouseDown={onClose}>
      <div className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {error && <span className="error block">{error}</span>}
    </label>
  )
}

export function SectionHeader({ kicker, title, text, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2 className="section-title">{title}</h2>
        {text && <p className="mt-2 max-w-2xl text-slate-500">{text}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHero({ title, text, children }) {
  return (
    <section className="hero-gradient relative overflow-hidden pb-16 pt-12 text-white">
      <div className="container-page relative">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-sky-100">{text}</p>}
        {children}
      </div>
      <div className="wave-divider absolute inset-x-0 bottom-0 h-8 bg-white" />
    </section>
  )
}
