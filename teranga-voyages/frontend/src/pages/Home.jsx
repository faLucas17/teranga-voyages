import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Award, Building2, Headphones, Luggage, Plane, Search, Shield, Wallet } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { DestinationCard, PackageCard } from '../components/Cards'
import { PageLoader, SectionHeader, Stars } from '../components/ui'
import { useSettings } from '../context/SettingsContext'
import { PACKAGE_TYPES } from '../utils/format'

function HeroSearch() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('voyages')
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('DSS')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (tab === 'voyages') navigate(`/voyages?${new URLSearchParams({ ...(q && { q }), ...(type && { type }) })}`)
    if (tab === 'vols') navigate(`/vols?${new URLSearchParams({ from, ...(to && { to }), ...(date && { date }) })}`)
    if (tab === 'hotels') navigate(`/hotels?${new URLSearchParams({ ...(q && { q }) })}`)
  }

  const tabs = [
    { id: 'voyages', label: 'Voyages', icon: Luggage },
    { id: 'vols', label: 'Vols', icon: Plane },
    { id: 'hotels', label: 'Hôtels', icon: Building2 },
  ]

  return (
    <div className="mt-10 max-w-4xl rounded-2xl bg-white p-2 shadow-2xl">
      <div className="flex gap-1 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === id ? 'bg-bic-600 text-white' : 'text-slate-600 hover:bg-sky-100'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="grid gap-2 p-2 md:grid-cols-[1fr_1fr_auto]">
        {tab === 'vols' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Départ (DSS)" />
              <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Arrivée (ex : Paris)" />
            </div>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </>
        ) : (
          <>
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'hotels' ? 'Ville ou nom d\'hôtel' : 'Où voulez-vous aller ?'} />
            {tab === 'voyages' ? (
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tous les types de voyage</option>
                {Object.entries(PACKAGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : <div className="hidden md:block" />}
          </>
        )}
        <button className="btn-primary px-8"><Search className="h-4 w-4" /> Rechercher</button>
      </form>
    </div>
  )
}

const advantages = [
  { icon: Wallet, title: 'Paiement local', text: 'Wave, Orange Money, carte ou espèces en agence.' },
  { icon: Shield, title: 'Agence agréée', text: 'Vos fonds et vos voyages sont sécurisés.' },
  { icon: Headphones, title: 'Assistance 24h/24', text: 'Un conseiller joignable pendant tout votre voyage.' },
  { icon: Award, title: 'Meilleurs prix', text: 'Tarifs négociés avec nos partenaires hôteliers et aériens.' },
]

export default function Home() {
  const settings = useSettings()
  const { data, loading } = useFetch('/home')

  return (
    <>
      <section className="hero-gradient relative overflow-hidden pb-28 pt-16 text-white sm:pt-24">
        <div className="pointer-events-none absolute -right-24 top-10 hidden h-96 w-96 rounded-full border-[40px] border-white/5 lg:block" />
        <div className="container-page relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-sky-100 ring-1 ring-white/20">
            <Plane className="h-4 w-4" /> Départs garantis depuis Dakar
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Le monde vous attend, <span className="text-sky-300">avec la Teranga.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-sky-100">{settings.agency_slogan}. Séjours, circuits, Omra, billets d'avion, hôtels et visas : réservez en ligne et payez avec Wave ou Orange Money.</p>
          <HeroSearch />
        </div>
        <div className="wave-divider absolute inset-x-0 bottom-0 h-16 bg-white" />
      </section>

      {data?.stats && (
        <section className="container-page -mt-6 relative z-10">
          <div className="card grid grid-cols-2 divide-slate-100 p-6 sm:grid-cols-4 sm:divide-x">
            {[
              ['Destinations', data.stats.destinations],
              ['Voyages', data.stats.packages],
              ['Hôtels partenaires', data.stats.hotels],
              ['Voyageurs heureux', data.stats.happy_travelers],
            ].map(([label, value]) => (
              <div key={label} className="p-2 text-center">
                <p className="text-3xl font-extrabold text-bic-600">{value}+</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-page py-16">
        <SectionHeader kicker="Coups de cœur" title="Nos voyages à la une"
          text="Des séjours pensés par nos conseillers, tout compris et au meilleur prix."
          action={<Link to="/voyages" className="btn-outline">Tous les voyages <ArrowRight className="h-4 w-4" /></Link>} />
        {loading ? <PageLoader /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.featured_packages?.map((p) => <PackageCard key={p.id} pkg={p} />)}
          </div>
        )}
      </section>

      <section className="bg-sky-50 py-16">
        <div className="container-page">
          <SectionHeader kicker="Inspiration" title="Destinations populaires"
            action={<Link to="/destinations" className="btn-outline">Toutes les destinations <ArrowRight className="h-4 w-4" /></Link>} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data?.featured_destinations?.map((d) => <DestinationCard key={d.id} destination={d} />)}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeader kicker="Pourquoi nous" title="Voyager l'esprit tranquille" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-bic-600"><Icon className="h-6 w-6" /></div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page">
        <div className="hero-gradient relative overflow-hidden rounded-3xl px-8 py-12 text-white sm:px-12">
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Omra & Hajj : partez sereinement</h2>
              <p className="mt-2 max-w-xl text-sky-100">Vols, visas, hôtels proches du Haram et encadrement religieux. Paiement échelonné possible.</p>
            </div>
            <Link to="/voyages?type=pelerinage" className="btn-white">Voir les offres <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {data?.testimonials?.length > 0 && (
        <section className="container-page py-16">
          <SectionHeader kicker="Témoignages" title="Ils ont voyagé avec nous" />
          <div className="grid gap-6 md:grid-cols-3">
            {data.testimonials.slice(0, 3).map((r) => (
              <figure key={r.id} className="card p-6">
                <Stars value={r.rating} />
                <blockquote className="mt-3 text-slate-600">« {r.comment} »</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-slate-900">{r.user?.name}</span>
                  {r.package && <span className="text-slate-500"> · {r.package.title}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
