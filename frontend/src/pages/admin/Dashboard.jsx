import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, CreditCard, FileText, MessageSquare, Ticket, TrendingUp, Users, Wallet } from 'lucide-react'
import useFetch from '../../hooks/useFetch'
import { PageLoader, StatusBadge } from '../../components/ui'
import { BOOKING_STATUS, KIND_LABELS, bookableTitle, date, money } from '../../utils/format'

const compact = (v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)

function Kpi({ icon: Icon, label, value, hint, tone = 'bic' }) {
  const tones = { bic: 'bg-bic-600 text-white', sky: 'bg-sky-100 text-bic-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700' }
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-6 w-6" /></div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-extrabold text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, loading } = useFetch('/admin/dashboard')
  if (loading || !data) return <PageLoader />
  const k = data.kpis
  const statusData = Object.entries(BOOKING_STATUS).map(([key, s]) => ({ name: s.label, value: Number(data.bookings_by_status?.[key] || 0), key }))
  const statusColors = { pending: '#F59E0B', confirmed: '#4FB3E8', paid: '#10B981', cancelled: '#EF4444', completed: '#0039A6' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble de l'activité de l'agence.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Wallet} label="Chiffre d'affaires du mois" value={money(k.revenue_month)} hint={`Total : ${money(k.revenue_total)}`} />
        <Kpi icon={Ticket} label="Réservations du mois" value={k.bookings_month} hint={`${k.bookings_total} au total`} tone="sky" />
        <Kpi icon={AlertCircle} label="En attente de paiement" value={k.bookings_pending} tone="amber" />
        <Kpi icon={Users} label="Clients inscrits" value={k.clients} tone="emerald" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [CreditCard, 'Paiements à valider', k.pending_payments, '/admin/paiements?status=pending'],
          [FileText, 'Demandes de visa ouvertes', k.open_visa_requests, '/admin/visas'],
          [MessageSquare, 'Messages non lus', k.unread_messages, '/admin/messages'],
          [TrendingUp, 'Avis à modérer', k.pending_reviews, '/admin/avis'],
        ].map(([Icon, label, value, to]) => (
          <Link key={label} to={to} className="card flex items-center justify-between p-4 transition hover:shadow-xl">
            <span className="flex items-center gap-2 text-sm text-slate-600"><Icon className="h-4 w-4 text-bic-600" /> {label}</span>
            <span className={`badge ${value > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{value}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Chiffre d'affaires (12 mois)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_by_month}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0039A6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4FB3E8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => money(v)} />
                <Area type="monotone" dataKey="revenue" name="CA" stroke="#0039A6" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Réservations par statut</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Réservations" radius={[0, 6, 6, 0]}>
                  {statusData.map((d) => <Cell key={d.key} fill={statusColors[d.key]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-bold">Dernières réservations</h2>
            <Link to="/admin/reservations" className="text-sm font-semibold text-bic-600">Tout voir</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>Référence</th><th>Client</th><th>Offre</th><th>Total</th><th>Statut</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.latest_bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-sky-50/50">
                    <td><Link to={`/admin/reservations/${b.id}`} className="font-semibold text-bic-600">{b.reference}</Link><p className="text-xs text-slate-400">{date(b.created_at)}</p></td>
                    <td>{b.user?.name}</td>
                    <td className="max-w-[220px] truncate">{KIND_LABELS[b.kind]} · {bookableTitle(b)}</td>
                    <td>{money(b.total)}</td>
                    <td><StatusBadge map={BOOKING_STATUS} value={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-bold">Voyages les plus vendus</h2>
          <ol className="space-y-3">
            {data.top_packages.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-bic-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.bookings_count} vente(s) · {p.seats_available} places restantes</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
