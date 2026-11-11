import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Search } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { FlightRow } from '../components/Cards'
import { EmptyState, PageHero, PageLoader, Pagination } from '../components/ui'
import { CABIN_CLASSES } from '../utils/format'

export default function Flights() {
  const [params, setParams] = useSearchParams()
  const filters = Object.fromEntries(params.entries())
  const [form, setForm] = useState({
    from: filters.from || 'DSS',
    to: filters.to || '',
    date: filters.date || '',
    passengers: filters.passengers || '1',
    cabin_class: filters.cabin_class || '',
  })
  const { data, loading } = useFetch('/flights', { params: filters })

  const submit = (e) => {
    e.preventDefault()
    setParams(Object.fromEntries(Object.entries(form).filter(([, v]) => v)))
  }

  return (
    <>
      <PageHero title="Billets d'avion" text="Comparez les vols au départ de Dakar et réservez en quelques clics.">
        <form onSubmit={submit} className="mt-6 grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_auto_1fr_1fr_120px_150px_auto]">
          <input className="input" placeholder="Départ" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          <button type="button" onClick={() => setForm({ ...form, from: form.to, to: form.from })} className="hidden items-center justify-center text-bic-600 md:flex" title="Inverser">
            <ArrowLeftRight className="h-5 w-5" />
          </button>
          <input className="input" placeholder="Arrivée (Paris, DXB...)" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="number" min={1} max={9} className="input" title="Passagers" value={form.passengers} onChange={(e) => setForm({ ...form, passengers: e.target.value })} />
          <select className="input" value={form.cabin_class} onChange={(e) => setForm({ ...form, cabin_class: e.target.value })}>
            <option value="">Toutes classes</option>
            {Object.entries(CABIN_CLASSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn-primary"><Search className="h-4 w-4" /> Rechercher</button>
        </form>
      </PageHero>
      <div className="container-page py-10">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <>
            <p className="mb-4 text-sm text-slate-500">{data.total} vol(s) disponible(s)</p>
            <div className="space-y-4">
              {data.data.map((f) => <FlightRow key={f.id} flight={f} passengers={filters.passengers || 1} />)}
            </div>
            <Pagination meta={data} onChange={(p) => setParams({ ...filters, page: String(p) })} />
          </>
        ) : <EmptyState title="Aucun vol trouvé" text="Modifiez votre recherche ou contactez-nous : nous trouvons aussi des vols hors catalogue." />}
      </div>
    </>
  )
}
