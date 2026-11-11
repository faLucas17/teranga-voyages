import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { errorMessage, fieldErrors } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Field, Logo, Spinner } from '../components/ui'

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-[80vh] lg:grid-cols-2">
      <div className="hero-gradient hidden flex-col justify-between p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h2 className="text-4xl font-extrabold leading-tight text-white">Votre prochain voyage commence ici.</h2>
          <p className="mt-4 max-w-md text-sky-100">Suivez vos réservations, payez en ligne avec Wave ou Orange Money et retrouvez vos voyages favoris.</p>
        </div>
        <p className="text-sm text-sky-200">Comptes de démonstration : admin@teranga.sn · agent@teranga.sn · client@teranga.sn (mot de passe : password)</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-1 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const user = await login(form)
      toast.success(`Bienvenue ${user.name.split(' ')[0]} !`)
      const fallback = ['admin', 'agent'].includes(user.role) ? '/admin' : '/compte'
      navigate(location.state?.from || fallback, { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Connexion" subtitle="Heureux de vous revoir.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail" error={errors.email}>
          <input type="email" required autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Mot de passe" error={errors.password}>
          <input type="password" required autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn-primary w-full py-3" disabled={loading}>{loading ? <Spinner /> : 'Se connecter'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Pas encore de compte ? <Link to="/inscription" state={location.state} className="font-semibold text-bic-600">Créer un compte</Link>
      </p>
    </AuthShell>
  )
}

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await register(form)
      toast.success('Compte créé avec succès !')
      navigate(location.state?.from || '/compte', { replace: true })
    } catch (err) {
      setErrors(fieldErrors(err))
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Créer un compte" subtitle="Quelques secondes suffisent.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom complet" error={errors.name}><input required className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="E-mail" error={errors.email}><input type="email" required className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Téléphone" error={errors.phone}><input className="input" placeholder="+221 77 ..." value={form.phone} onChange={set('phone')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mot de passe" error={errors.password}><input type="password" required minLength={8} className="input" value={form.password} onChange={set('password')} /></Field>
          <Field label="Confirmation"><input type="password" required minLength={8} className="input" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
        </div>
        <button className="btn-primary w-full py-3" disabled={loading}>{loading ? <Spinner /> : 'Créer mon compte'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà inscrit ? <Link to="/connexion" state={location.state} className="font-semibold text-bic-600">Se connecter</Link>
      </p>
    </AuthShell>
  )
}
