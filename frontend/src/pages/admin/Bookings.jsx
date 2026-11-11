import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import useFetch from '../../hooks/useFetch'
import { EmptyState, Modal, PageLoader, Pagination, Spinner, StatusBadge } from '../../components/ui'
import { BookingSummary } from '../account/BookingDetail'
import {
  BOOKING_STATUS, KIND_LABELS, PAYMENT_METHODS, PAYMENT_STATUS, bookableTitle, date, dateTime, money,
} from '../../utils/format'

export function AdminBookings() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const { data, loading } = useFetch('/admin/bookings', { params: filters })
  const update = (k, v) => {
    const next = new URLSearchParams(params)
    v ? next.set(k, v) : next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }

  const exportCsv = async () => {
    try {
      const res = await api.get('/admin/bookings/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Réservations</h1>
          <p className="text-sm text-slate-500">Suivi des dossiers clients, paiements et statuts.</p>
        </div>
        <button className="btn-light" onClick={exportCsv}><Download className="h-4 w-4" /> Exporter (Excel/CSV)</button>
      </div>
      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Référence, nom, e-mail, téléphone..." defaultValue={filters.q || ''} onKeyDown={(e) => e.key === 'Enter' && update('q', e.currentTarget.value)} />
        </div>
        <select className="input w-auto" value={filters.status || ''} onChange={(e) => update('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input w-auto" value={filters.kind || ''} onChange={(e) => update('kind', e.target.value)}>
          <option value="">Tous les produits</option>
          {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>Référence</th><th>Client</th><th>Offre</th><th>Départ</th><th>Total</th><th>Payé</th><th>Statut</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((b) => (
                  <tr key={b.id} className="hover:bg-sky-50/50">
                    <td><Link to={`/admin/reservations/${b.id}`} className="font-semibold text-bic-600">{b.reference}</Link><p className="text-xs text-slate-400">{dateTime(b.created_at)}</p></td>
                    <td><p className="font-medium">{b.contact_name || b.user?.name}</p><p className="text-xs text-slate-500">{b.contact_phone}</p></td>
                    <td className="max-w-[240px] truncate">{KIND_LABELS[b.kind]} · {bookableTitle(b)}</td>
                    <td>{date(b.start_date)}</td>
                    <td className="font-semibold">{money(b.total)}</td>
                    <td>{money(b.amount_paid)}</td>
                    <td><StatusBadge map={BOOKING_STATUS} value={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-6"><EmptyState /></div>}
      </div>
      <Pagination meta={data} onChange={(p) => update('page', String(p))} />
    </div>
  )
}

export function AdminBookingShow() {
  const { id } = useParams()
  const { data: booking, setData, loading } = useFetch(`/admin/bookings/${id}`)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState(null)
  const [saving, setSaving] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payment, setPayment] = useState({ amount: '', method: 'cash', transaction_ref: '' })

  if (loading) return <PageLoader />
  if (!booking) return <EmptyState title="Réservation introuvable" />

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put(`/admin/bookings/${booking.id}`, {
        ...(status && status !== booking.status && { status }),
        admin_notes: notes ?? booking.admin_notes,
      })
      setData(data)
      setStatus('')
      toast.success('Réservation mise à jour (le client est notifié par e-mail)')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const recordPayment = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/admin/bookings/${booking.id}/payments`, { ...payment, amount: Number(payment.amount) })
      setData(data)
      setPayOpen(false)
      toast.success('Paiement enregistré')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const confirmPayment = async (p) => {
    try {
      await api.post(`/admin/payments/${p.id}/confirm`)
      const { data } = await api.get(`/admin/bookings/${booking.id}`)
      setData(data)
      toast.success('Paiement validé')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const pending = booking.payments?.filter((p) => p.status === 'pending') || []

  return (
    <div className="space-y-6">
      <Link to="/admin/reservations" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-bic-600"><ArrowLeft className="h-4 w-4" /> Retour aux réservations</Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-bic-600">{booking.reference}</h1>
              <p className="text-sm text-slate-500">Client : {booking.user?.name} · {booking.user?.email} · créée le {dateTime(booking.created_at)}</p>
            </div>
            <StatusBadge map={BOOKING_STATUS} value={booking.status} />
          </div>
          <BookingSummary booking={booking} />
          {booking.special_requests && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm"><strong>Demandes du client :</strong> {booking.special_requests}</p>}
          {booking.cancellation_reason && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"><strong>Annulation :</strong> {booking.cancellation_reason}</p>}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold">Gestion du dossier</h2>
            <label className="block">
              <span className="label">Changer le statut</span>
              <select className="input" value={status || booking.status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Notes internes</span>
              <textarea className="input min-h-24" value={notes ?? booking.admin_notes ?? ''} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button className="btn-primary w-full" onClick={save} disabled={saving}>{saving ? <Spinner /> : 'Enregistrer'}</button>
          </div>

          <div className="card space-y-3 p-5">
            <h2 className="font-bold">Paiements</h2>
            <p className="text-sm">Reste à payer : <strong className="text-bic-600">{money(booking.balance_due)}</strong></p>
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm">
                <span>{PAYMENT_METHODS[p.method]?.label} · {money(p.amount)}</span>
                <button className="btn-primary btn-sm" onClick={() => confirmPayment(p)}><Check className="h-3.5 w-3.5" /> Valider</button>
              </div>
            ))}
            {booking.balance_due > 0 && booking.status !== 'cancelled' && (
              <button className="btn-outline w-full" onClick={() => { setPayment({ amount: booking.balance_due, method: 'cash', transaction_ref: '' }); setPayOpen(true) }}>
                Encaisser un paiement
              </button>
            )}
          </div>
        </aside>
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Encaisser un paiement">
        <form onSubmit={recordPayment} className="space-y-4">
          <label className="block"><span className="label">Montant (FCFA)</span>
            <input type="number" min={1} max={booking.balance_due} required className="input" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
          </label>
          <label className="block"><span className="label">Moyen de paiement</span>
            <select className="input" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Référence (reçu, transaction...)</span>
            <input className="input" value={payment.transaction_ref} onChange={(e) => setPayment({ ...payment, transaction_ref: e.target.value })} />
          </label>
          <button className="btn-primary w-full">Enregistrer le paiement</button>
        </form>
      </Modal>
    </div>
  )
}

export function AdminPayments() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const { data, loading, reload } = useFetch('/admin/payments', { params: filters })
  const update = (k, v) => {
    const next = new URLSearchParams(params)
    v ? next.set(k, v) : next.delete(k)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }
  const confirm = async (p) => {
    try {
      await api.post(`/admin/payments/${p.id}/confirm`)
      toast.success('Paiement validé')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Paiements</h1>
      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <select className="input w-auto" value={filters.status || ''} onChange={(e) => update('status', e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input w-auto" value={filters.method || ''} onChange={(e) => update('method', e.target.value)}>
          <option value="">Tous les moyens</option>
          {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>Date</th><th>Réservation</th><th>Client</th><th>Moyen</th><th>Référence</th><th>Montant</th><th>Statut</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((p) => (
                  <tr key={p.id}>
                    <td>{dateTime(p.paid_at || p.created_at)}</td>
                    <td><Link to={`/admin/reservations/${p.booking_id}`} className="font-semibold text-bic-600">{p.booking?.reference}</Link></td>
                    <td>{p.user?.name}</td>
                    <td>{PAYMENT_METHODS[p.method]?.label}{p.driver === 'simulation' && <span className="ml-1 text-xs text-slate-400">(simulé)</span>}</td>
                    <td className="font-mono text-xs">{p.transaction_ref}</td>
                    <td className="font-semibold">{money(p.amount)}</td>
                    <td><StatusBadge map={PAYMENT_STATUS} value={p.status} /></td>
                    <td>{p.status === 'pending' && <button className="btn-primary btn-sm" onClick={() => confirm(p)}>Valider</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-6"><EmptyState /></div>}
      </div>
      <Pagination meta={data} onChange={(p) => update('page', String(p))} />
    </div>
  )
}
