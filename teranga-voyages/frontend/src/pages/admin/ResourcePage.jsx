import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../../api/client'
import { EmptyState, Field, Modal, PageLoader, Pagination, Spinner } from '../../components/ui'

/* ------------------------------------------------------------------ */
/* Conversion des valeurs entre le formulaire et l'API                 */
/* ------------------------------------------------------------------ */
function toForm(field, value) {
  if (value === null || value === undefined) {
    if (field.type === 'checkbox') return field.default ?? false
    return field.default ?? ''
  }
  if (field.type === 'list') return (value || []).join('\n')
  if (field.type === 'itinerary') return (value || []).map((d) => `${d.day} | ${d.title || ''} | ${d.description || ''}`).join('\n')
  if (field.type === 'date') return String(value).slice(0, 10)
  if (field.type === 'datetime') return String(value).slice(0, 16)
  return value
}

function toApi(field, value) {
  if (field.type === 'number') return value === '' ? null : Number(value)
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'list') return String(value || '').split('\n').map((s) => s.trim()).filter(Boolean)
  if (field.type === 'itinerary') {
    return String(value || '').split('\n').map((line, i) => {
      const [day, title, ...rest] = line.split('|').map((s) => s.trim())
      return { day: Number(day) || i + 1, title: title || '', description: rest.join(' | ') }
    }).filter((d) => d.title || d.description)
  }
  return value === '' ? null : value
}

function ImageInput({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const body = new FormData()
    body.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/admin/uploads', body)
      onChange(data.url)
      toast.success('Image envoyée')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className="flex gap-2">
      <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="URL de l'image ou téléversement" />
      <label className="btn-light shrink-0 cursor-pointer">
        {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
        <input type="file" accept="image/*" className="hidden" onChange={upload} />
      </label>
    </div>
  )
}

function FieldInput({ field, value, onChange, options }) {
  const common = { className: 'input', value: value ?? '', onChange: (e) => onChange(e.target.value), required: field.required }
  switch (field.type) {
    case 'textarea':
      return <textarea {...common} className="input min-h-28" />
    case 'list':
      return <textarea {...common} className="input min-h-24" placeholder="Un élément par ligne" />
    case 'itinerary':
      return <textarea {...common} className="input min-h-32 font-mono text-xs" placeholder={'1 | Arrivée | Accueil à l\'aéroport...\n2 | Visite | ...'} />
    case 'select':
      return (
        <select {...common}>
          <option value="">— Choisir —</option>
          {(options || field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
    case 'checkbox':
      return (
        <span className="flex items-center gap-2 pt-2">
          <input type="checkbox" className="h-5 w-5 accent-bic-600" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-sm text-slate-600">{field.hint || 'Oui'}</span>
        </span>
      )
    case 'image':
      return <ImageInput value={value} onChange={onChange} />
    case 'number':
      return <input type="number" {...common} min={field.min ?? 0} step={field.step ?? 1} />
    case 'date':
      return <input type="date" {...common} />
    case 'datetime':
      return <input type="datetime-local" {...common} />
    case 'password':
      return <input type="password" {...common} placeholder={field.placeholder} />
    default:
      return <input type={field.inputType || 'text'} {...common} placeholder={field.placeholder} />
  }
}

/**
 * Page CRUD générique du back-office.
 * Props : title, endpoint, columns, fields, filters, searchPlaceholder, canCreate, canDelete
 */
export default function ResourcePage({
  title, subtitle, endpoint, columns, fields, filters = [], searchPlaceholder = 'Rechercher...',
  canCreate = true, canDelete = true, optionsLoader,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState({ page: 1, q: '' })
  const [editing, setEditing] = useState(null) // null | {} (création) | item
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [dynamicOptions, setDynamicOptions] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(endpoint, { params: Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '')) })
      setData(data)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [JSON.stringify(query)]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { optionsLoader?.().then(setDynamicOptions).catch(() => {}) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (item) => {
    setErrors({})
    setEditing(item || {})
    setForm(Object.fromEntries(fields.map((f) => [f.name, toForm(f, item?.[f.name])])))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    const payload = Object.fromEntries(fields.filter((f) => !(f.type === 'password' && !form[f.name])).map((f) => [f.name, toApi(f, form[f.name])]))
    try {
      if (editing?.id) await api.put(`${endpoint}/${editing.id}`, payload)
      else await api.post(endpoint, payload)
      toast.success(editing?.id ? 'Modifications enregistrées' : 'Élément créé')
      setEditing(null)
      load()
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm('Supprimer définitivement cet élément ?')) return
    try {
      await api.delete(`${endpoint}/${item.id}`)
      toast.success('Supprimé')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {canCreate && <button className="btn-primary" onClick={() => open(null)}><Plus className="h-4 w-4" /> Ajouter</button>}
      </div>

      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder={searchPlaceholder} defaultValue={query.q}
            onKeyDown={(e) => e.key === 'Enter' && setQuery({ ...query, q: e.currentTarget.value, page: 1 })} />
        </div>
        {filters.map((f) => (
          <select key={f.name} className="input w-auto" value={query[f.name] || ''} onChange={(e) => setQuery({ ...query, [f.name]: e.target.value, page: 1 })}>
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? <PageLoader /> : data?.data?.length ? (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((item) => (
                  <tr key={item.id} className="hover:bg-sky-50/50">
                    {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>)}
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-2 text-bic-600 hover:bg-sky-100" onClick={() => open(item)} title="Modifier"><Pencil className="h-4 w-4" /></button>
                        {canDelete && <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(item)} title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="p-6"><EmptyState /></div>}
      </div>
      <Pagination meta={data} onChange={(page) => setQuery({ ...query, page })} />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier' : 'Ajouter'} wide>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.name} label={f.label + (f.required ? ' *' : '')} error={errors[f.name] || errors[`${f.name}.0`]}
              className={['textarea', 'list', 'itinerary'].includes(f.type) || f.full ? 'sm:col-span-2' : ''}>
              <FieldInput field={f} value={form[f.name]} options={dynamicOptions[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />
            </Field>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-light" onClick={() => setEditing(null)}>Annuler</button>
            <button className="btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
