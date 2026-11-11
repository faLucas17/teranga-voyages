import { useSearchParams } from 'react-router-dom'
import useFetch from '../hooks/useFetch'
import { HotelCard } from '../components/Cards'
import { EmptyState, PageHero, PageLoader, Pagination } from '../components/ui'

export default function Hotels() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const { data, loading } = useFetch('/hotels', { params: { per_page: 9, ...filters } })
  const { data: destinations } = useFetch('/destinations')

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <>
      <PageHero title="Hôtels" text="Des établissements sélectionnés par nos conseillers, au meilleur prix.">
        <div className="mt-6 grid max-w-3xl gap-2 rounded-2xl bg-white p-2 sm:grid-cols-3">
          <input className="input" placeholder="Nom ou ville" defaultValue={filters.q || ''} onKeyDown={(e) => e.key === 'Enter' && update('q', e.currentTarget.value)} onBlur={(e) => update('q', e.target.value)} />
          <select className="input" value={filters.destination || ''} onChange={(e) => update('destination', e.target.value)}>
            <option value="">Toutes les destinations</option>
            {(destinations || []).map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
          </select>
          <select className="input" value={filters.stars || ''} onChange={(e) => update('stars', e.target.value)}>
            <option value="">Toutes catégories</option>
            <option value="3">3★ et plus</option>
            <option value="4">4★ et plus</option>
            <option value="5">5★</option>
          </select>
        </div>
      </PageHero>
      <div className="container-page py-10">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((h) => <HotelCard key={h.id} hotel={h} />)}
            </div>
            <Pagination meta={data} onChange={(p) => update('page', String(p))} />
          </>
        ) : <EmptyState title="Aucun hôtel trouvé" />}
      </div>
    </>
  )
}
