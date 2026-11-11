import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, FileText, Mail, MapPin, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fieldErrors } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { Field, PageHero, Spinner } from '../components/ui'
import { VISA_TYPES } from '../utils/format'

export function Contact() {
  const s = useSettings()
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setErrors({})
    try {
      const { data } = await api.post('/contact', form)
      toast.success(data.message)
      setForm({ ...form, subject: '', message: '' })
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHero title="Contactez-nous" text="Une question, un devis de groupe, un voyage sur mesure ? Nos conseillers vous répondent." />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
          <Field label="Nom complet" error={errors.name}><input required className="input" value={form.name} onChange={set('name')} /></Field>
          <Field label="E-mail" error={errors.email}><input required type="email" className="input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Téléphone" error={errors.phone}><input className="input" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Sujet" error={errors.subject}>
            <select required className="input" value={form.subject} onChange={set('subject')}>
              <option value="">Choisir...</option>
              <option>Demande de devis</option>
              <option>Voyage de groupe</option>
              <option>Omra / Hajj</option>
              <option>Billet d'avion</option>
              <option>Réclamation</option>
              <option>Autre</option>
            </select>
          </Field>
          <Field label="Message" error={errors.message} className="sm:col-span-2">
            <textarea required minLength={10} className="input min-h-40" value={form.message} onChange={set('message')} />
          </Field>
          <div className="sm:col-span-2"><button className="btn-primary" disabled={sending}>{sending ? <Spinner /> : 'Envoyer le message'}</button></div>
        </form>
        <aside className="space-y-4">
          {[
            [MapPin, 'Adresse', s.agency_address],
            [Phone, 'Téléphone', s.agency_phone],
            [Mail, 'E-mail', s.agency_email],
            [Clock, 'Horaires', s.agency_hours],
          ].map(([Icon, label, value]) => (
            <div key={label} className="card flex gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-bic-600"><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm text-slate-500">{label}</p><p className="font-semibold">{value}</p></div>
            </div>
          ))}
        </aside>
      </div>
    </>
  )
}

export function Visa() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    destination_country: '', visa_type: 'tourisme', travel_date: '', passport_number: '', message: '',
  })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(null)
  const [sending, setSending] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setErrors({})
    try {
      const { data } = await api.post('/visa-requests', Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')))
      setDone(data.visa_request)
      toast.success(data.message)
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageHero title="Assistance visa" text="Schengen, Dubaï, Turquie, États-Unis, Omra... Nous constituons et suivons votre dossier." />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        {done ? (
          <div className="card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-7 w-7" /></div>
            <h2 className="mt-4 text-2xl font-bold">Demande enregistrée</h2>
            <p className="mt-2 text-slate-500">Votre référence : <strong className="text-bic-600">{done.reference}</strong>. Un conseiller vous contacte sous 24 h ouvrées.</p>
            {user && <Link to="/compte/visas" className="btn-primary mt-6">Suivre mes demandes</Link>}
          </div>
        ) : (
          <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
            <Field label="Nom complet" error={errors.full_name}><input required className="input" value={form.full_name} onChange={set('full_name')} /></Field>
            <Field label="E-mail" error={errors.email}><input required type="email" className="input" value={form.email} onChange={set('email')} /></Field>
            <Field label="Téléphone" error={errors.phone}><input required className="input" value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Pays de destination" error={errors.destination_country}><input required className="input" placeholder="France, Canada..." value={form.destination_country} onChange={set('destination_country')} /></Field>
            <Field label="Type de visa" error={errors.visa_type}>
              <select className="input" value={form.visa_type} onChange={set('visa_type')}>
                {Object.entries(VISA_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Date de voyage prévue" error={errors.travel_date}><input type="date" className="input" value={form.travel_date} onChange={set('travel_date')} /></Field>
            <Field label="N° de passeport (facultatif)" error={errors.passport_number}><input className="input" value={form.passport_number} onChange={set('passport_number')} /></Field>
            <Field label="Précisions" error={errors.message} className="sm:col-span-2"><textarea className="input min-h-28" value={form.message} onChange={set('message')} /></Field>
            <div className="sm:col-span-2"><button className="btn-primary" disabled={sending}>{sending ? <Spinner /> : 'Envoyer ma demande'}</button></div>
          </form>
        )}
        <aside className="card h-fit p-6">
          <h3 className="flex items-center gap-2 font-bold"><FileText className="h-5 w-5 text-bic-600" /> Documents généralement demandés</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {['Passeport valide 6 mois après le retour', 'Photos d\'identité aux normes', 'Relevés bancaires des 3 derniers mois', 'Attestation de travail ou d\'inscription', 'Réservation d\'hôtel et de vol', 'Assurance voyage'].map((x) => (
              <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-500" /> {x}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">La décision finale appartient à l'ambassade ou au consulat. Nous vous accompagnons pour maximiser vos chances.</p>
        </aside>
      </div>
    </>
  )
}

export function About() {
  const s = useSettings()
  return (
    <>
      <PageHero title={`À propos de ${s.agency_name}`} text={s.agency_slogan} />
      <div className="container-page max-w-3xl space-y-5 py-10 leading-relaxed text-slate-600">
        <p><strong className="text-slate-900">{s.agency_name}</strong> est une agence de voyage basée à Dakar. Notre mission : rendre le voyage simple, sûr et accessible, avec la chaleur de la teranga sénégalaise.</p>
        <p>Nous organisons des séjours balnéaires, des circuits culturels, des pèlerinages (Omra et Hajj), des voyages de noces et des voyages d'affaires. Nous vendons également des billets d'avion, réservons des hôtels dans le monde entier et accompagnons nos clients dans leurs démarches de visa.</p>
        <p>Réservez en ligne 24h/24, payez avec Wave, Orange Money, carte bancaire ou en agence, et suivez toutes vos réservations depuis votre espace client.</p>
        <Link to="/contact" className="btn-primary">Parler à un conseiller</Link>
      </div>
    </>
  )
}

export function Terms() {
  const s = useSettings()
  const sections = [
    ['Réservation', 'Toute réservation effectuée sur le site est enregistrée immédiatement et les places sont bloquées. Elle devient ferme après paiement total ou confirmation écrite de l\'agence.'],
    ['Prix et paiement', 'Les prix sont indiqués en francs CFA (XOF), toutes taxes comprises sauf mention contraire. Le paiement s\'effectue par Wave, Orange Money, carte bancaire, virement ou espèces en agence. Une réservation non payée sous 48 h peut être annulée automatiquement.'],
    ['Annulation par le client', 'Une réservation en attente de paiement peut être annulée gratuitement depuis l\'espace client. Après paiement, les frais d\'annulation dépendent des conditions des prestataires (compagnies aériennes, hôtels) et vous seront communiqués par l\'agence.'],
    ['Formalités', 'Le voyageur est responsable de la validité de son passeport et de l\'obtention des visas. L\'agence propose un service d\'assistance visa mais ne peut garantir la décision des autorités consulaires.'],
    ['Données personnelles', 'Les données collectées servent uniquement à la gestion des réservations et ne sont jamais revendues. Vous pouvez demander leur modification ou suppression à tout moment.'],
  ]
  return (
    <>
      <PageHero title="Conditions générales de vente" text={`Applicables à toutes les prestations vendues par ${s.agency_name}.`} />
      <div className="container-page max-w-3xl space-y-6 py-10">
        {sections.map(([title, text], i) => (
          <section key={title}>
            <h2 className="text-lg font-bold">{i + 1}. {title}</h2>
            <p className="mt-2 text-slate-600">{text}</p>
          </section>
        ))}
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Modèle à faire relire par un juriste avant la mise en ligne.</p>
      </div>
    </>
  )
}

export function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-7xl font-extrabold text-bic-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Cette page s'est envolée</h1>
      <p className="mt-2 text-slate-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary mt-6">Retour à l'accueil</Link>
    </div>
  )
}
