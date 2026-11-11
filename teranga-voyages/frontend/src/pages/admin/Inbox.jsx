import { useEffect, useState } from 'react'
import { Check, Mail, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../../api/client'
import useFetch from '../../hooks/useFetch'
import { EmptyState, Modal, PageLoader, Pagination, Spinner, Stars, StatusBadge } from '../../components/ui'
import { VISA_STATUS, VISA_TYPES, date, dateTime } from '../../utils/format'

function useList(url) {
  const [query, setQuery] = useState({ page: 1 })
  const result = useFetch(url, { params: query })
  return { ...result, query, setQuery }
}

export function AdminReviews() {
  const { data, loading, reload, query, setQuery } = useList('/admin/reviews')
  const act = async (fn) => {
    try { await fn(); reload() } catch (err) { toast.error(errorMessage(err)) }
  }
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Avis clients</h1>
        <select className="input w-auto" value={query.is_approved ?? ''} onChange={(e) => setQuery({ page: 1, ...(e.target.value !== '' && { is_approved: e.target.value }) })}>
          <option value="">Tous</option><option value="0">À modérer</option><option value="1">Publiés</option>
        </select>
      </div>
      {loading ? <PageLoader /> : data?.data?.length ? (
        <div className="space-y-3">
          {data.data.map((r) => (
            <div key={r.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2"><Stars value={r.rating} size="h-3.5 w-3.5" /><span className="text-xs text-slate-400">{date(r.created_at)}</span></div>
                <p className="mt-1 font-semibold">{r.title || 'Sans titre'} <span className="font-normal text-slate-500">· {r.package?.title}</span></p>
                <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
                <p className="mt-1 text-xs text-slate-500">{r.user?.name} ({r.user?.email})</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.is_approved
                  ? <button className="btn-light btn-sm" onClick={() => act(() => api.put(`/admin/reviews/${r.id}`, { is_approved: false }))}><X className="h-3.5 w-3.5" /> Dépublier</button>
                  : <button className="btn-primary btn-sm" onClick={() => act(() => api.put(`/admin/reviews/${r.id}`, { is_approved: true }))}><Check className="h-3.5 w-3.5" /> Publier</button>}
                <button className="btn-sm btn text-red-600 hover:bg-red-50" onClick={() => window.confirm('Supprimer cet avis ?') && act(() => api.delete(`/admin/reviews/${r.id}`))}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          <Pagination meta={data} onChange={(page) => setQuery({ ...query, page })} />
        </div>
      ) : <EmptyState title="Aucun avis" />}
    </div>
  )
}

export function AdminMessages() {
  const { data, loading, reload, query, setQuery } = useList('/admin/messages')
  const [open, setOpen] = useState(null)

  const read = async (m) => {
    setOpen(m)
    if (!m.is_read) {
      await api.put(`/admin/messages/${m.id}`, { is_read: true }).catch(() => {})
      reload()
    }
  }
  const remove = async (m) => {
    if (!window.confirm('Supprimer ce message ?')) return
    await api.delete(`/admin/messages/${m.id}`)
    setOpen(null)
    reload()
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Messages de contact</h1>
        <select className="input w-auto" value={query.is_read ?? ''} onChange={(e) => setQuery({ page: 1, ...(e.target.value !== '' && { is_read: e.target.value }) })}>
          <option value="">Tous</option><option value="0">Non lus</option><option value="1">Lus</option>
        </select>
      </div>
      {loading ? <PageLoader /> : data?.data?.length ? (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {data.data.map((m) => (
            <button key={m.id} onClick={() => read(m)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-sky-50/60">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${m.is_read ? 'bg-slate-200' : 'bg-bic-600'}`} />
              <div className="min-w-0 flex-1">
                <p className={`truncate ${m.is_read ? '' : 'font-bold'}`}>{m.subject} <span className="font-normal text-slate-500">— {m.name}</span></p>
                <p className="truncate text-sm text-slate-500">{m.message}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{dateTime(m.created_at)}</span>
            </button>
          ))}
        </div>
      ) : <EmptyState title="Boîte de réception vide" />}
      <Pagination meta={data} onChange={(page) => setQuery({ ...query, page })} />

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.subject}>
        {open && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{open.name} · {open.email} {open.phone && `· ${open.phone}`}<br />{dateTime(open.created_at)}</p>
            <p className="whitespace-pre-line rounded-xl bg-sky-50 p-4">{open.message}</p>
            <div className="flex gap-2">
              <a className="btn-primary" href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}><Mail className="h-4 w-4" /> Répondre</a>
              <button className="btn text-red-600 hover:bg-red-50" onClick={() => remove(open)}><Trash2 className="h-4 w-4" /> Supprimer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function AdminVisas() {
  const { data, loading, reload, query, setQuery } = useList('/admin/visa-requests')
  const [edit, setEdit] = useState(null)

  const save = async () => {
    try {
      await api.put(`/admin/visa-requests/${edit.id}`, { status: edit.status, admin_notes: edit.admin_notes })
      toast.success('Demande mise à jour')
      setEdit(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Demandes de visa</h1>
        <select className="input w-auto" value={query.status || ''} onChange={(e) => setQuery({ page: 1, ...(e.target.value && { status: e.target.value }) })}>
          <option value="">Tous les statuts</option>
          {Object.entries(VISA_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead><tr><th>Référence</th><th>Demandeur</th><th>Destination</th><th>Type</th><th>Voyage</th><th>Statut</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((v) => (
                  <tr key={v.id}>
                    <td className="font-semibold text-bic-600">{v.reference}<p className="text-xs font-normal text-slate-400">{date(v.created_at)}</p></td>
                    <td><p>{v.full_name}</p><p className="text-xs text-slate-500">{v.phone} · {v.email}</p></td>
                    <td>{v.destination_country}</td>
                    <td>{VISA_TYPES[v.visa_type]}</td>
                    <td>{date(v.travel_date)}</td>
                    <td><StatusBadge map={VISA_STATUS} value={v.status} /></td>
                    <td><button className="btn-light btn-sm" onClick={() => setEdit({ ...v })}>Traiter</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-6"><EmptyState /></div>}
      </div>
      <Pagination meta={data} onChange={(page) => setQuery({ ...query, page })} />

      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={`Demande ${edit?.reference || ''}`}>
        {edit && (
          <div className="space-y-4">
            {edit.message && <p className="rounded-xl bg-sky-50 p-3 text-sm">{edit.message}</p>}
            {edit.passport_number && <p className="text-sm">Passeport : <strong>{edit.passport_number}</strong></p>}
            <label className="block"><span className="label">Statut</span>
              <select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {Object.entries(VISA_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="block"><span className="label">Note visible par le client</span>
              <textarea className="input min-h-24" value={edit.admin_notes || ''} onChange={(e) => setEdit({ ...edit, admin_notes: e.target.value })} />
            </label>
            <button className="btn-primary w-full" onClick={save}>Enregistrer</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function AdminNewsletter() {
  const { data, loading, query, setQuery } = useList('/admin/newsletter')
  const copy = () => {
    navigator.clipboard?.writeText((data?.data || []).map((s) => s.email).join(', '))
    toast.success('Adresses copiées')
  }
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} abonné(s)</p>
        </div>
        <button className="btn-light" onClick={copy}>Copier les e-mails</button>
      </div>
      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <table className="table-admin">
            <thead><tr><th>E-mail</th><th>Inscrit le</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((s) => <tr key={s.id}><td>{s.email}</td><td>{dateTime(s.created_at)}</td></tr>)}
            </tbody>
          </table>
        ) : <div className="p-6"><EmptyState title="Aucun abonné" /></div>}
      </div>
      <Pagination meta={data} onChange={(page) => setQuery({ ...query, page })} />
    </div>
  )
}

const SETTING_LABELS = {
  agency_name: 'Nom de l\'agence',
  agency_slogan: 'Slogan',
  agency_email: 'E-mail de contact',
  agency_phone: 'Téléphone',
  agency_whatsapp: 'WhatsApp (bouton flottant)',
  agency_address: 'Adresse',
  agency_hours: 'Horaires d\'ouverture',
  facebook_url: 'Page Facebook',
  instagram_url: 'Compte Instagram',
  tiktok_url: 'Compte TikTok',
  bank_details: 'Coordonnées bancaires (virement)',
}

export function AdminSettings() {
  const [rows, setRows] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setRows(data.map(({ key, value, is_public }) => ({ key, value: value ?? '', is_public }))))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/admin/settings', { settings: rows })
      setRows(data.map(({ key, value, is_public }) => ({ key, value: value ?? '', is_public })))
      toast.success('Paramètres enregistrés. Rechargez le site pour les voir.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!rows) return <PageLoader />

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Paramètres de l'agence</h1>
      <p className="mb-6 text-sm text-slate-500">Ces informations s'affichent sur le site (en-tête, pied de page, contact, e-mails). Idéal pour revendre l'application à une autre agence.</p>
      <div className="card space-y-4 p-6">
        {rows.map((r, i) => (
          <div key={r.key} className="grid gap-2 sm:grid-cols-[200px_1fr_auto] sm:items-center">
            <span className="text-sm font-medium text-slate-700">{SETTING_LABELS[r.key] || r.key}</span>
            <input className="input" value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
            <label className="flex items-center gap-1 text-xs text-slate-500" title="Visible publiquement">
              <input type="checkbox" className="accent-bic-600" checked={r.is_public} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, is_public: e.target.checked } : x)))} /> public
            </label>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-light" onClick={() => {
            const key = window.prompt('Clé du paramètre (lettres minuscules et _ uniquement)')
            if (key && /^[a-z0-9_]+$/.test(key)) setRows([...rows, { key, value: '', is_public: true }])
          }}><Plus className="h-4 w-4" /> Ajouter un paramètre</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  )
}
