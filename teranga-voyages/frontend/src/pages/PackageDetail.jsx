import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Check, Clock, Heart, MapPin, Plane, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client'
import useFetch from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { PackageCard } from '../components/Cards'
import { Badge, EmptyState, Img, PageLoader, Stars } from '../components/ui'
import { date, money, PACKAGE_TYPES } from '../utils/format'

function ReviewForm({ slug, onDone }) {
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })
  const [sending, setSending] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const { data } = await api.post(`/packages/${slug}/reviews`, form)
      toast.success(data.message)
      setForm({ rating: 5, title: '', comment: '' })
      onDone?.()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }
  return (
    <form onSubmit={submit} className="card mt-6 space-y-3 p-5">
      <p className="font-semibold">Donner votre avis</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })} className={`text-2xl ${n <= form.rating ? 'text-amber-400' : 'text-slate-300'}`}>★</button>
        ))}
      </div>
      <input className="input" placeholder="Titre (facultatif)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className="input min-h-24" required minLength={10} placeholder="Racontez votre expérience..." value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
      <button className="btn-primary" disabled={sending}>Publier</button>
    </form>
  )
}

export default function PackageDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, loading, error, setData } = useFetch(`/packages/${slug}`)
  const { data: reviews } = useFetch(`/packages/${slug}/reviews`)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [photo, setPhoto] = useState(0)

  if (loading) return <PageLoader />
  if (error || !data) return <div className="container-page py-16"><EmptyState title="Voyage introuvable" action={<Link to="/voyages" className="btn-primary">Voir les voyages</Link>} /></div>

  const { package: pkg, related } = data
  const photos = [pkg.cover_image, ...(pkg.gallery || [])].filter(Boolean)
  const total = adults * pkg.price + children * (pkg.child_price ?? pkg.price)

  const toggleFavorite = async () => {
    if (!user) return navigate('/connexion', { state: { from: `/voyages/${slug}` } })
    try {
      const { data: res } = await api.post(`/packages/${slug}/favorite`)
      setData({ ...data, package: { ...pkg, is_favorite: res.is_favorite } })
      toast.success(res.is_favorite ? 'Ajouté à vos favoris' : 'Retiré de vos favoris')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="container-page py-10">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/voyages" className="hover:text-bic-600">Voyages</Link> / <span className="text-slate-800">{pkg.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-3xl">
            <Img src={photos[photo]} alt={pkg.title} label={pkg.destination?.name} className="h-72 w-full sm:h-[420px]" />
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl ring-2 ${i === photo ? 'ring-bic-600' : 'ring-transparent'}`}>
                  <Img src={p} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="bg-sky-100 text-bic-700">{PACKAGE_TYPES[pkg.type]}</Badge>
              <h1 className="mt-2 text-3xl font-extrabold">{pkg.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-slate-500"><MapPin className="h-4 w-4" /> {pkg.destination?.name}, {pkg.destination?.country}</p>
              {pkg.approved_reviews_avg_rating && (
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Stars value={pkg.approved_reviews_avg_rating} showValue /> ({pkg.approved_reviews_count} avis)
                </p>
              )}
            </div>
            <button onClick={toggleFavorite} className={`btn ${pkg.is_favorite ? 'bg-red-50 text-red-600' : 'btn-light'}`}>
              <Heart className={`h-4 w-4 ${pkg.is_favorite ? 'fill-red-500' : ''}`} /> {pkg.is_favorite ? 'Dans mes favoris' : 'Ajouter aux favoris'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [Clock, 'Durée', `${pkg.duration_days} jours`],
              [Plane, 'Départ', pkg.departure_city],
              [Calendar, 'Date', pkg.start_date ? date(pkg.start_date) : 'À la demande'],
              [Users, 'Places', `${pkg.seats_available} / ${pkg.seats_total}`],
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-2xl bg-sky-50 p-4">
                <Icon className="h-5 w-5 text-bic-600" />
                <p className="mt-2 text-xs text-slate-500">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold">Présentation</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{pkg.description || pkg.summary}</p>
          </section>

          {pkg.itinerary?.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold">Programme jour par jour</h2>
              <ol className="mt-5 space-y-4 border-l-2 border-sky-200 pl-6">
                {pkg.itinerary.map((d, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full bg-bic-600 text-xs font-bold text-white">{d.day || i + 1}</span>
                    <p className="font-semibold">{d.title}</p>
                    <p className="text-sm text-slate-500">{d.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-emerald-700">Ce qui est inclus</h3>
              <ul className="space-y-2 text-sm">
                {(pkg.included || []).map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-500" /> {x}</li>)}
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-red-700">Non inclus</h3>
              <ul className="space-y-2 text-sm">
                {(pkg.excluded || []).map((x) => <li key={x} className="flex gap-2"><X className="h-4 w-4 shrink-0 text-red-400" /> {x}</li>)}
              </ul>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-bold">Avis des voyageurs</h2>
            {reviews?.data?.length ? (
              <div className="mt-4 space-y-4">
                {reviews.data.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{r.user?.name}</p>
                      <Stars value={r.rating} size="h-3.5 w-3.5" />
                    </div>
                    {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                    <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-sm text-slate-500">Pas encore d'avis pour ce voyage.</p>}
            {user && <ReviewForm slug={slug} />}
          </section>
        </div>

        <aside>
          <div className="card sticky top-24 p-6">
            <p className="text-sm text-slate-500">Prix par adulte</p>
            <p className="text-3xl font-extrabold text-bic-600">{money(pkg.price)}</p>
            {pkg.child_price !== null && <p className="text-sm text-slate-500">Enfant : {money(pkg.child_price)}</p>}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label>
                <span className="label">Adultes</span>
                <input type="number" min={1} max={pkg.seats_available || 1} value={adults} onChange={(e) => setAdults(Math.max(1, +e.target.value))} className="input" />
              </label>
              <label>
                <span className="label">Enfants</span>
                <input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, +e.target.value))} className="input" />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-slate-600">Total estimé</span>
              <span className="text-xl font-bold">{money(total)}</span>
            </div>

            {pkg.seats_available > 0 ? (
              <Link to={`/reservation?type=package&slug=${pkg.slug}&adults=${adults}&children=${children}`} className="btn-primary mt-5 w-full py-3">Réserver ce voyage</Link>
            ) : (
              <button disabled className="btn-primary mt-5 w-full py-3">Complet</button>
            )}
            <Link to="/contact" className="btn-light mt-3 w-full">Poser une question</Link>
            <p className="mt-4 text-center text-xs text-slate-500">Paiement sécurisé · Wave · Orange Money · Carte</p>
          </div>
        </aside>
      </div>

      {related?.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">Vous aimerez aussi</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <PackageCard key={p.id} pkg={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
