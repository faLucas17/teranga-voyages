import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import useFetch from '../../hooks/useFetch'
import { useSettings } from '../../context/SettingsContext'
import { EmptyState, Logo, Modal, PageLoader, Spinner, StatusBadge } from '../../components/ui'
import {
  BOOKING_STATUS, KIND_LABELS, PAYMENT_METHODS, PAYMENT_STATUS, bookableTitle, date, dateTime, money,
} from '../../utils/format'

/** Bloc réutilisé côté client et côté back-office */
export function BookingSummary({ booking }) {
  const lines = booking.meta?.lines || []
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="Prestation" value={`${KIND_LABELS[booking.kind]} · ${bookableTitle(booking)}`} />
        <Info label="Dates" value={booking.start_date ? `${date(booking.start_date)}${booking.end_date ? ' → ' + date(booking.end_date) : ''}` : '—'} />
        <Info label="Voyageurs" value={`${booking.adults} adulte(s), ${booking.children} enfant(s)`} />
        <Info label="Contact" value={booking.contact_name} />
        <Info label="Téléphone" value={booking.contact_phone || '—'} />
        <Info label="E-mail" value={booking.contact_email} />
      </div>

      {booking.travelers?.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">Voyageurs</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="table-admin">
              <thead><tr><th>Nom</th><th>Type</th><th>Naissance</th><th>Passeport</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {booking.travelers.map((t) => (
                  <tr key={t.id}><td>{t.first_name} {t.last_name}</td><td>{t.type === 'adult' ? 'Adulte' : 'Enfant'}</td><td>{date(t.birth_date)}</td><td>{t.passport_number || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-sky-50 p-4 text-sm">
        {lines.map((l) => <div key={l.label} className="flex justify-between py-0.5"><span>{l.label}</span><span>{money(l.amount)}</span></div>)}
        {booking.discount > 0 && <div className="flex justify-between py-0.5 text-emerald-700"><span>Réduction {booking.coupon?.code}</span><span>- {money(booking.discount)}</span></div>}
        <div className="mt-2 flex justify-between border-t border-sky-200 pt-2 text-base font-bold"><span>Total</span><span>{money(booking.total)}</span></div>
        <div className="flex justify-between py-0.5 text-emerald-700"><span>Déjà payé</span><span>{money(booking.amount_paid)}</span></div>
        <div className="flex justify-between py-0.5 font-semibold text-bic-700"><span>Reste à payer</span><span>{money(booking.balance_due)}</span></div>
      </div>

      {booking.payments?.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">Paiements</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="table-admin">
              <thead><tr><th>Date</th><th>Moyen</th><th>Référence</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {booking.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{dateTime(p.paid_at || p.created_at)}</td>
                    <td>{PAYMENT_METHODS[p.method]?.label || p.method}</td>
                    <td className="font-mono text-xs">{p.transaction_ref}</td>
                    <td>{money(p.amount)}</td>
                    <td><StatusBadge map={PAYMENT_STATUS} value={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  )
}

function PayModal({ booking, open, onClose, onPaid }) {
  const settings = useSettings()
  const [method, setMethod] = useState('wave')
  const [phone, setPhone] = useState(booking.contact_phone || '')
  const [loading, setLoading] = useState(false)
  const methods = settings.payment_methods || Object.keys(PAYMENT_METHODS)

  const pay = async () => {
    setLoading(true)
    try {
      const { data } = await api.post(`/bookings/${booking.id}/pay`, { method, phone })
      if (data.payment.checkout_url) {
        window.location.href = data.payment.checkout_url // redirection vers Wave, etc.
        return
      }
      if (data.payment.status === 'succeeded') toast.success('Paiement réussi, merci !')
      else toast.success('Paiement enregistré : il sera validé par l\'agence.')
      onPaid(data.booking)
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Payer ${money(booking.balance_due)}`}>
      <div className="space-y-2">
        {methods.map((m) => (
          <label key={m} className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 ${method === m ? 'border-bic-600 bg-sky-50' : 'border-slate-200'}`}>
            <span>
              <span className="block font-semibold">{PAYMENT_METHODS[m]?.label || m}</span>
              <span className="text-xs text-slate-500">{PAYMENT_METHODS[m]?.hint}</span>
            </span>
            <input type="radio" name="method" className="h-4 w-4 accent-bic-600" checked={method === m} onChange={() => setMethod(m)} />
          </label>
        ))}
      </div>
      {['wave', 'orange_money'].includes(method) && (
        <label className="mt-4 block">
          <span className="label">Numéro {PAYMENT_METHODS[method].label}</span>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 ..." />
        </label>
      )}
      {method === 'bank_transfer' && settings.bank_details && <p className="mt-4 rounded-xl bg-sky-50 p-3 text-sm">{settings.bank_details}</p>}
      {settings.payment_mode === 'simulation' && !['cash', 'bank_transfer'].includes(method) && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Mode démonstration : le paiement est simulé, aucun débit réel.</p>
      )}
      <button className="btn-primary mt-6 w-full py-3" onClick={pay} disabled={loading}>{loading ? <Spinner /> : 'Valider le paiement'}</button>
    </Modal>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const settings = useSettings()
  const { data: booking, setData, loading, error } = useFetch(`/bookings/${id}`)
  const [payOpen, setPayOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  if (loading) return <PageLoader />
  if (error || !booking) return <EmptyState title="Réservation introuvable" action={<Link to="/compte" className="btn-primary">Mes réservations</Link>} />

  const canPay = ['pending', 'confirmed'].includes(booking.status) && booking.balance_due > 0
  const canCancel = ['pending', 'confirmed'].includes(booking.status)

  const cancel = async () => {
    if (!window.confirm('Annuler cette réservation ? Les places seront libérées.')) return
    setCancelling(true)
    try {
      const { data } = await api.post(`/bookings/${booking.id}/cancel`)
      setData({ ...booking, ...data })
      toast.success('Réservation annulée')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      {params.get('nouveau') && booking.status === 'pending' && (
        <div className="flex gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-800 no-print">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Réservation enregistrée !</p>
            <p className="text-sm">Vos places sont bloquées. Réglez maintenant pour confirmer définitivement votre voyage.</p>
          </div>
        </div>
      )}
      {params.get('paiement') === 'succes' && <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800 no-print">Paiement en cours de confirmation, merci !</div>}
      {params.get('paiement') === 'echec' && <div className="rounded-2xl bg-red-50 p-4 text-red-700 no-print">Le paiement n'a pas abouti. Vous pouvez réessayer.</div>}

      <div className="card p-6">
        <div className="hidden print:mb-6 print:flex print:items-center print:justify-between">
          <Logo />
          <div className="text-right text-xs">
            <p>{settings.agency_address}</p><p>{settings.agency_phone} · {settings.agency_email}</p>
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Réservation</p>
            <h1 className="text-2xl font-extrabold text-bic-600">{booking.reference}</h1>
            <p className="text-sm text-slate-500">Créée le {dateTime(booking.created_at)}</p>
          </div>
          <StatusBadge map={BOOKING_STATUS} value={booking.status} />
        </div>
        <BookingSummary booking={booking} />
        <div className="mt-6 flex flex-wrap gap-3 no-print">
          {canPay && <button className="btn-primary" onClick={() => setPayOpen(true)}>Payer {money(booking.balance_due)}</button>}
          <button className="btn-light" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimer / PDF</button>
          {canCancel && <button className="btn text-red-600 hover:bg-red-50" onClick={cancel} disabled={cancelling}>Annuler la réservation</button>}
        </div>
      </div>
      {canPay && <PayModal booking={booking} open={payOpen} onClose={() => setPayOpen(false)} onPaid={(b) => setData({ ...booking, ...b })} />}
    </div>
  )
}
