import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../../api/client'
import useFetch from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { PackageCard } from '../../components/Cards'
import { EmptyState, Field, PageLoader, Pagination, Spinner, StatusBadge } from '../../components/ui'
import { BOOKING_STATUS, KIND_LABELS, VISA_STATUS, VISA_TYPES, bookableTitle, date, money } from '../../utils/format'

export function MyBookings() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const page = params.get('page') || 1
  const { data, loading } = useFetch('/bookings', { params: { status, page } })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mes réservations</h1>
        <select className="input w-auto" value={status} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}>
          <option value="">Tous les statuts</option>
          {Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {loading ? <PageLoader /> : data?.data?.length ? (
        <div className="space-y-4">
          {data.data.map((b) => (
            <Link key={b.id} to={`/compte/reservations/${b.id}`} className="card flex flex-col gap-3 p-5 transition hover:shadow-xl sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">{KIND_LABELS[b.kind]} · {b.reference}</p>
                <p className="font-bold">{bookableTitle(b)}</p>
                <p className="text-sm text-slate-500">{b.start_date ? `Départ le ${date(b.start_date)}` : `Réservé le ${date(b.created_at)}`} · {b.adults + b.children} voyageur(s)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-bic-600">{money(b.total)}</p>
                  <StatusBadge map={BOOKING_STATUS} value={b.status} />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300" />
              </div>
            </Link>
          ))}
          <Pagination meta={data} onChange={(p) => setParams({ ...(status && { status }), page: String(p) })} />
        </div>
      ) : (
        <EmptyState title="Aucune réservation pour le moment" text="Découvrez nos voyages et réservez votre prochaine escapade." action={<Link to="/voyages" className="btn-primary">Explorer les voyages</Link>} />
      )}
    </div>
  )
}

export function Favorites() {
  const { data, loading } = useFetch('/favorites')
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mes favoris</h1>
      {loading ? <PageLoader /> : data?.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{data.map((p) => <PackageCard key={p.id} pkg={p} />)}</div>
      ) : <EmptyState title="Aucun favori" text="Cliquez sur ♥ sur un voyage pour le retrouver ici." action={<Link to="/voyages" className="btn-primary">Voir les voyages</Link>} />}
    </div>
  )
}

export function MyVisas() {
  const { data, loading } = useFetch('/my/visa-requests')
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes demandes de visa</h1>
        <Link to="/visa" className="btn-primary btn-sm">Nouvelle demande</Link>
      </div>
      {loading ? <PageLoader /> : data?.length ? (
        <div className="space-y-3">
          {data.map((v) => (
            <div key={v.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-semibold text-sky-500">{v.reference}</p>
                <p className="font-bold">{v.destination_country} · {VISA_TYPES[v.visa_type]}</p>
                <p className="text-sm text-slate-500">Envoyée le {date(v.created_at)}{v.travel_date && ` · voyage le ${date(v.travel_date)}`}</p>
                {v.admin_notes && <p className="mt-2 rounded-lg bg-sky-50 p-2 text-sm text-slate-700">Note de l'agence : {v.admin_notes}</p>}
              </div>
              <StatusBadge map={VISA_STATUS} value={v.status} />
            </div>
          ))}
        </div>
      ) : <EmptyState title="Aucune demande de visa" action={<Link to="/visa" className="btn-primary">Faire une demande</Link>} />}
    </div>
  )
}

export function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({
    name: user.name || '', email: user.email || '', phone: user.phone || '',
    address: user.address || '', city: user.city || '', country: user.country || '',
  })
  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const { data } = await api.put('/auth/profile', form)
      setUser(data)
      toast.success('Profil mis à jour')
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put('/auth/password', pwd)
      toast.success(data.message)
      setPwd({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <form onSubmit={save} className="card grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Nom complet" error={errors.name}><input required className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="E-mail" error={errors.email}><input required type="email" className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Téléphone" error={errors.phone}><input className="input" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Adresse" error={errors.address}><input className="input" value={form.address} onChange={set('address')} /></Field>
        <Field label="Ville" error={errors.city}><input className="input" value={form.city} onChange={set('city')} /></Field>
        <Field label="Pays" error={errors.country}><input className="input" value={form.country} onChange={set('country')} /></Field>
        <div className="sm:col-span-2"><button className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Enregistrer'}</button></div>
      </form>
      <form onSubmit={changePassword} className="card grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="font-bold sm:col-span-3">Changer de mot de passe</h2>
        <input type="password" required className="input" placeholder="Mot de passe actuel" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} />
        <input type="password" required minLength={8} className="input" placeholder="Nouveau mot de passe" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} />
        <input type="password" required minLength={8} className="input" placeholder="Confirmation" value={pwd.password_confirmation} onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })} />
        <div className="sm:col-span-3"><button className="btn-outline">Mettre à jour</button></div>
      </form>
    </div>
  )
}
