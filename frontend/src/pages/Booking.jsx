import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Luggage, Plane, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { EmptyState, Field, Img, PageLoader, Spinner } from '../components/ui'
import { date, dateTime, money } from '../utils/format'

const today = () => new Date().toISOString().slice(0, 10)
const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}

function itemUrl(type, params) {
  if (type === 'package') return `/packages/${params.get('slug')}`
  if (type === 'hotel') return `/hotels/${params.get('slug')}`
  if (type === 'flight') return `/flights/${params.get('id')}`
  return null
}

function Summary({ type, item }) {
  if (type === 'package') {
    const pkg = item.package
    return (
      <div className="flex gap-4">
        <Img src={pkg.cover_image} className="h-20 w-24 shrink-0 rounded-xl" label="" />
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold text-sky-500"><Luggage className="h-3.5 w-3.5" /> Voyage</p>
          <p className="font-bold">{pkg.title}</p>
          <p className="text-sm text-slate-500">{pkg.duration_days} jours · départ {pkg.start_date ? date(pkg.start_date) : 'à définir'}</p>
        </div>
      </div>
    )
  }
  if (type === 'hotel') {
    return (
      <div className="flex gap-4">
        <Img src={item.image} className="h-20 w-24 shrink-0 rounded-xl" label="" />
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold text-sky-500"><Building2 className="h-3.5 w-3.5" /> Hôtel {item.stars}★</p>
          <p className="font-bold">{item.name}</p>
          <p className="text-sm text-slate-500">{money(item.price_per_night)} / nuit</p>
        </div>
      </div>
    )
  }
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-semibold text-sky-500"><Plane className="h-3.5 w-3.5" /> Vol {item.flight_number}</p>
      <p className="font-bold">{item.from_city} → {item.to_city}</p>
      <p className="text-sm text-slate-500">{item.airline} · {dateTime(item.departure_at)}</p>
    </div>
  )
}

export default function Booking() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const type = params.get('type')
  const { data: raw, loading } = useFetch(itemUrl(type, params))
  const item = raw
  const bookableId = type === 'package' ? raw?.package?.id : raw?.id

  const [form, setForm] = useState({
    adults: Number(params.get('adults')) || 1,
    children: Number(params.get('children')) || 0,
    rooms: 1,
    start_date: addDays(today(), 7),
    end_date: addDays(today(), 10),
    contact_name: user?.name || '',
    contact_email: user?.email || '',
    contact_phone: user?.phone || '',
    special_requests: '',
    coupon_code: '',
    accept: false,
  })
  const [travelers, setTravelers] = useState([])
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [coupon, setCoupon] = useState('')

  const total = Number(form.adults) + Number(form.children)

  // Ajuste la liste des voyageurs au nombre de personnes
  useEffect(() => {
    setTravelers((prev) => Array.from({ length: Math.min(total, 30) }, (_, i) => prev[i] || {
      first_name: i === 0 ? (user?.name || '').split(' ')[0] : '',
      last_name: i === 0 ? (user?.name || '').split(' ').slice(1).join(' ') : '',
      type: i < form.adults ? 'adult' : 'child',
      birth_date: '',
      passport_number: '',
      nationality: 'Sénégalaise',
    }).map((t, i) => ({ ...t, type: i < form.adults ? 'adult' : 'child' })))
  }, [total, form.adults, user])

  const payload = useMemo(() => ({
    bookable_type: type,
    bookable_id: bookableId,
    adults: Number(form.adults),
    children: Number(form.children),
    ...(type === 'hotel' && { start_date: form.start_date, end_date: form.end_date, rooms: Number(form.rooms) }),
    ...(coupon && { coupon_code: coupon }),
  }), [type, bookableId, form.adults, form.children, form.start_date, form.end_date, form.rooms, coupon])

  // Devis en temps réel
  useEffect(() => {
    if (!bookableId) return
    const t = setTimeout(async () => {
      try {
        const { data } = await api.post('/bookings/quote', payload)
        setQuote(data)
        setQuoteError('')
      } catch (err) {
        setQuote(null)
        setQuoteError(errorMessage(err))
        if (coupon && fieldErrors(err).coupon_code) setCoupon('')
      }
    }, 300)
    return () => clearTimeout(t)
  }, [payload, bookableId, coupon])

  if (loading) return <PageLoader />
  if (!raw || !type) return <div className="container-page py-16"><EmptyState title="Offre introuvable" action={<Link to="/voyages" className="btn-primary">Voir les voyages</Link>} /></div>

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setTraveler = (i, key, value) => setTravelers(travelers.map((t, j) => (j === i ? { ...t, [key]: value } : t)))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.accept) return toast.error('Veuillez accepter les conditions générales de vente.')
    setSubmitting(true)
    setErrors({})
    try {
      const { data } = await api.post('/bookings', {
        ...payload,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        special_requests: form.special_requests || null,
        travelers: travelers.filter((t) => t.first_name && t.last_name).map((t) => Object.fromEntries(Object.entries(t).filter(([, v]) => v !== ''))),
      })
      toast.success(`Réservation ${data.reference} enregistrée !`)
      navigate(`/compte/reservations/${data.id}?nouveau=1`)
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold">Finaliser ma réservation</h1>
      <p className="mt-1 text-slate-500">Vérifiez les informations, puis réglez en ligne ou en agence.</p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">1. Voyageurs et dates</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Adultes" error={errors.adults}>
                <input type="number" min={1} max={30} className="input" value={form.adults} onChange={set('adults')} />
              </Field>
              <Field label="Enfants (- 12 ans)" error={errors.children}>
                <input type="number" min={0} max={30} className="input" value={form.children} onChange={set('children')} />
              </Field>
              {type === 'hotel' && (
                <Field label="Chambres" error={errors.rooms}>
                  <input type="number" min={1} max={20} className="input" value={form.rooms} onChange={set('rooms')} />
                </Field>
              )}
            </div>
            {type === 'hotel' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Arrivée" error={errors.start_date}>
                  <input type="date" min={today()} className="input" value={form.start_date} onChange={set('start_date')} />
                </Field>
                <Field label="Départ" error={errors.end_date}>
                  <input type="date" min={form.start_date} className="input" value={form.end_date} onChange={set('end_date')} />
                </Field>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">2. Coordonnées de contact</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nom complet" error={errors.contact_name}><input required className="input" value={form.contact_name} onChange={set('contact_name')} /></Field>
              <Field label="E-mail" error={errors.contact_email}><input required type="email" className="input" value={form.contact_email} onChange={set('contact_email')} /></Field>
              <Field label="Téléphone" error={errors.contact_phone}><input required className="input" placeholder="+221 77 ..." value={form.contact_phone} onChange={set('contact_phone')} /></Field>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-1 text-lg font-bold">3. Informations des voyageurs</h2>
            <p className="mb-4 text-sm text-slate-500">Les noms doivent correspondre aux passeports. Le numéro de passeport peut être fourni plus tard.</p>
            <div className="space-y-4">
              {travelers.map((t, i) => (
                <div key={i} className="rounded-xl bg-sky-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-bic-700">Voyageur {i + 1} · {t.type === 'adult' ? 'Adulte' : 'Enfant'}</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input className="input" placeholder="Prénom" value={t.first_name} onChange={(e) => setTraveler(i, 'first_name', e.target.value)} required={i === 0} />
                    <input className="input" placeholder="Nom" value={t.last_name} onChange={(e) => setTraveler(i, 'last_name', e.target.value)} required={i === 0} />
                    <input className="input" type="date" title="Date de naissance" value={t.birth_date} onChange={(e) => setTraveler(i, 'birth_date', e.target.value)} />
                    <input className="input" placeholder="N° passeport" value={t.passport_number} onChange={(e) => setTraveler(i, 'passport_number', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold">4. Demandes particulières</h2>
            <textarea className="input min-h-24" placeholder="Régime alimentaire, chambre communicante, assistance PMR..." value={form.special_requests} onChange={set('special_requests')} />
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-bic-600" checked={form.accept} onChange={set('accept')} />
              <span>J'accepte les <Link to="/conditions" target="_blank" className="text-bic-600 underline">conditions générales de vente</Link>.</span>
            </label>
          </section>
        </div>

        <aside>
          <div className="card sticky top-24 space-y-5 p-6">
            <Summary type={type} item={item} />

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input className="input pl-9 uppercase" placeholder="Code promo" value={form.coupon_code} onChange={set('coupon_code')} />
              </div>
              <button type="button" className="btn-light" onClick={() => setCoupon(form.coupon_code.trim())}>Appliquer</button>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
              {quote?.lines?.map((l) => (
                <div key={l.label} className="flex justify-between"><span className="text-slate-600">{l.label}</span><span>{money(l.amount)}</span></div>
              ))}
              {quote?.discount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Réduction {quote.coupon?.code}</span><span>- {money(quote.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-bold">
                <span>Total</span><span className="text-bic-600">{quote ? money(quote.total) : '—'}</span>
              </div>
              {quoteError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{quoteError}</p>}
            </div>

            <button className="btn-primary w-full py-3" disabled={submitting || !quote}>
              {submitting ? <Spinner /> : 'Confirmer la réservation'}
            </button>
            <p className="text-center text-xs text-slate-500">Vos places sont bloquées immédiatement. Paiement à l'étape suivante.</p>
          </div>
        </aside>
      </form>
    </div>
  )
}
