import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { PackageCard } from '../components/Cards'
import { EmptyState, PageHero, PageLoader, Pagination } from '../components/ui'
import { PACKAGE_TYPES } from '../utils/format'

export default function Packages() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const { data, loading } = useFetch('/packages', { params: { per_page: 9, ...filters } })
  const { data: destinations } = useFetch('/destinations')

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  return (
    <>
      <PageHero title="Nos voyages" text="Séjours, circuits, pèlerinages et week-ends : trouvez le voyage qui vous ressemble." />
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="card h-fit space-y-5 p-5">
            <p className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4 text-bic-600" /> Filtres</p>
            <div>
              <label className="label">Recherche</label>
              <input className="input" defaultValue={filters.q || ''} placeholder="Dubaï, Omra..." onKeyDown={(e) => e.key === 'Enter' && update('q', e.currentTarget.value)} onBlur={(e) => update('q', e.target.value)} />
            </div>
            <div>
              <label className="label">Type de voyage</label>
              <select className="input" value={filters.type || ''} onChange={(e) => update('type', e.target.value)}>
                <option value="">Tous</option>
                {Object.entries(PACKAGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Destination</label>
              <select className="input" value={filters.destination || ''} onChange={(e) => update('destination', e.target.value)}>
                <option value="">Toutes</option>
                {(destinations || []).map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Budget max (FCFA)</label>
              <select className="input" value={filters.max_price || ''} onChange={(e) => update('max_price', e.target.value)}>
                <option value="">Sans limite</option>
                {[200000, 500000, 1000000, 1500000, 2500000].map((v) => <option key={v} value={v}>{new Intl.NumberFormat('fr-FR').format(v)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Durée max</label>
              <select className="input" value={filters.max_days || ''} onChange={(e) => update('max_days', e.target.value)}>
                <option value="">Toutes</option>
                <option value="3">3 jours</option>
                <option value="7">1 semaine</option>
                <option value="10">10 jours</option>
                <option value="15">15 jours</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-bic-600" checked={filters.available === '1'} onChange={(e) => update('available', e.target.checked ? '1' : '')} />
              Uniquement les places disponibles
            </label>
            {params.toString() && <button className="btn-light w-full" onClick={() => setParams({})}>Réinitialiser</button>}
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">{data ? `${data.total} voyage(s) trouvé(s)` : ' '}</p>
              <select className="input w-auto" value={filters.sort || ''} onChange={(e) => update('sort', e.target.value)}>
                <option value="">Recommandés</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="date">Date de départ</option>
                <option value="duration">Durée</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>
            {loading ? <PageLoader /> : data?.data?.length ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {data.data.map((p) => <PackageCard key={p.id} pkg={p} />)}
                </div>
                <Pagination meta={data} onChange={(page) => update('page', String(page))} />
              </>
            ) : (
              <EmptyState title="Aucun voyage ne correspond" text="Essayez d'élargir vos critères ou contactez-nous pour un voyage sur mesure." />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
