import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { DestinationCard, HotelCard, PackageCard } from '../components/Cards'
import { EmptyState, Img, PageHero, PageLoader } from '../components/ui'

const CONTINENTS = ['Afrique', 'Europe', 'Asie', 'Amérique', 'Océanie']

export function Destinations() {
  const [continent, setContinent] = useState('')
  const { data, loading } = useFetch('/destinations', { params: continent ? { continent } : {} })

  return (
    <>
      <PageHero title="Destinations" text="Du Sénégal au bout du monde : laissez-vous inspirer.">
        <div className="mt-6 flex flex-wrap gap-2">
          {['', ...CONTINENTS].map((c) => (
            <button key={c || 'all'} onClick={() => setContinent(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${continent === c ? 'bg-white text-bic-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {c || 'Toutes'}
            </button>
          ))}
        </div>
      </PageHero>
      <div className="container-page py-10">
        {loading ? <PageLoader /> : data?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((d) => <DestinationCard key={d.id} destination={d} />)}
          </div>
        ) : <EmptyState title="Aucune destination" />}
      </div>
    </>
  )
}

export function DestinationDetail() {
  const { slug } = useParams()
  const { data: d, loading, error } = useFetch(`/destinations/${slug}`)

  if (loading) return <PageLoader />
  if (error || !d) return <div className="container-page py-16"><EmptyState title="Destination introuvable" action={<Link to="/destinations" className="btn-primary">Retour</Link>} /></div>

  return (
    <>
      <section className="relative h-80 overflow-hidden sm:h-96">
        <Img src={d.image} alt={d.name} label={d.name} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-bic-900/90 to-bic-900/10" />
        <div className="container-page relative flex h-full flex-col justify-end pb-10 text-white">
          <p className="flex items-center gap-1 text-sky-200"><MapPin className="h-4 w-4" /> {d.country} · {d.continent}</p>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{d.name}</h1>
          {d.best_period && <p className="mt-2 flex items-center gap-1 text-sm text-sky-100"><Calendar className="h-4 w-4" /> Meilleure période : {d.best_period}</p>}
        </div>
      </section>
      <div className="container-page py-10">
        <p className="max-w-3xl text-lg leading-relaxed text-slate-600">{d.description}</p>

        <h2 className="section-title mb-6 mt-12">Voyages vers {d.name}</h2>
        {d.packages?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {d.packages.map((p) => <PackageCard key={p.id} pkg={{ ...p, destination: d }} />)}
          </div>
        ) : <EmptyState title="Pas encore de voyage programmé" text="Contactez-nous pour un voyage sur mesure." action={<Link to="/contact" className="btn-primary">Demander un devis</Link>} />}

        {d.hotels?.length > 0 && (
          <>
            <h2 className="section-title mb-6 mt-12">Hôtels à {d.name}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {d.hotels.map((h) => <HotelCard key={h.id} hotel={{ ...h, destination: d }} />)}
            </div>
          </>
        )}
      </div>
    </>
  )
}
