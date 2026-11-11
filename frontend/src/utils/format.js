export const CURRENCY = 'FCFA'

export function money(value, currency = CURRENCY) {
  const n = Number(value || 0)
  return `${new Intl.NumberFormat('fr-FR').format(n)} ${currency === 'XOF' ? 'FCFA' : currency}`
}

export function date(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', options).format(d)
}

export function dateTime(value) {
  return date(value, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function time(value) {
  return date(value, { hour: '2-digit', minute: '2-digit' })
}

export function duration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} h ${String(m).padStart(2, '0')}`
}

export const PACKAGE_TYPES = {
  sejour: 'Séjour',
  circuit: 'Circuit',
  pelerinage: 'Pèlerinage',
  safari: 'Safari',
  croisiere: 'Croisière',
  weekend: 'Week-end',
}

export const BOOKING_STATUS = {
  pending: { label: 'En attente de paiement', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmée', className: 'bg-sky-100 text-sky-600' },
  paid: { label: 'Payée', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Voyage effectué', className: 'bg-bic-100 text-bic-700' },
}

export const PAYMENT_STATUS = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  succeeded: { label: 'Réussi', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Échoué', className: 'bg-red-100 text-red-700' },
  refunded: { label: 'Remboursé', className: 'bg-slate-100 text-slate-700' },
}

export const PAYMENT_METHODS = {
  wave: { label: 'Wave', hint: 'Paiement mobile Wave' },
  orange_money: { label: 'Orange Money', hint: 'Paiement mobile Orange Money' },
  card: { label: 'Carte bancaire', hint: 'Visa, Mastercard' },
  bank_transfer: { label: 'Virement bancaire', hint: 'Validé à réception' },
  cash: { label: 'Espèces en agence', hint: 'Réglez à notre agence' },
}

export const VISA_STATUS = {
  received: { label: 'Reçue', className: 'bg-slate-100 text-slate-700' },
  processing: { label: 'En traitement', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Accordé', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', className: 'bg-red-100 text-red-700' },
}

export const VISA_TYPES = {
  tourisme: 'Tourisme',
  affaires: 'Affaires',
  etudes: 'Études',
  omra: 'Omra',
  hajj: 'Hajj',
  transit: 'Transit',
}

export const CABIN_CLASSES = {
  economy: 'Économique',
  premium: 'Premium',
  business: 'Affaires',
  first: 'Première',
}

export const KIND_LABELS = { package: 'Voyage', hotel: 'Hôtel', flight: 'Vol' }

/** Titre lisible d'un élément réservable (forfait, hôtel ou vol). */
export function bookableTitle(booking) {
  const b = booking?.bookable
  if (!b) return 'Offre supprimée'
  return b.title || b.name || b.label || `${b.airline} ${b.flight_number}`
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}
