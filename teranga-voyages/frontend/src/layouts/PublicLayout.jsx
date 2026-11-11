import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Clock, LayoutDashboard, LogOut, Mail, MapPin, Menu, MessageCircle, Phone, User, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../api/client'
import { Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'

const links = [
  { to: '/voyages', label: 'Voyages' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/vols', label: 'Vols' },
  { to: '/hotels', label: 'Hôtels' },
  { to: '/visa', label: 'Visa' },
  { to: '/contact', label: 'Contact' },
]

function Navbar() {
  const { user, isStaff, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-bic-600 bg-sky-100' : 'text-slate-600 hover:text-bic-600'}`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur no-print">
      <div className="container-page flex items-center justify-between py-3">
        <Link to="/" aria-label="Accueil"><Logo /></Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {isStaff && (
                <Link to="/admin" className="btn-light btn-sm"><LayoutDashboard className="h-4 w-4" /> Back-office</Link>
              )}
              <Link to="/compte" className="btn-outline btn-sm"><User className="h-4 w-4" /> {user.name.split(' ')[0]}</Link>
              <button onClick={async () => { await logout(); navigate('/') }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn-light btn-sm">Connexion</Link>
              <Link to="/inscription" className="btn-primary btn-sm">Créer un compte</Link>
            </>
          )}
        </div>

        <button className="rounded-lg p-2 text-slate-700 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {links.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
            <div className="mt-3 flex flex-wrap gap-2">
              {user ? (
                <>
                  <Link to="/compte" className="btn-outline btn-sm">Mon espace</Link>
                  {isStaff && <Link to="/admin" className="btn-light btn-sm">Back-office</Link>}
                  <button onClick={logout} className="btn-light btn-sm">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link to="/connexion" className="btn-light btn-sm">Connexion</Link>
                  <Link to="/inscription" className="btn-primary btn-sm">Créer un compte</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/newsletter', { email })
      toast.success(data.message)
      setEmail('')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }
  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre adresse e-mail" className="input border-white/20 bg-white/10 text-white placeholder:text-sky-200 focus:ring-white/20" />
      <button className="btn-white shrink-0" disabled={loading}>S'inscrire</button>
    </form>
  )
}

function Footer() {
  const s = useSettings()
  return (
    <footer className="mt-20 bg-bic-800 text-sky-100 no-print">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light name={(s.agency_name || 'Teranga').split(' ')[0]} />
          <p className="mt-4 text-sm leading-relaxed text-sky-200">{s.agency_slogan}. Séjours, circuits, pèlerinages, billets d'avion, hôtels et visas au départ de Dakar.</p>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Nos offres</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/voyages?type=sejour" className="hover:text-white">Séjours</Link></li>
            <li><Link to="/voyages?type=circuit" className="hover:text-white">Circuits</Link></li>
            <li><Link to="/voyages?type=pelerinage" className="hover:text-white">Omra & Hajj</Link></li>
            <li><Link to="/vols" className="hover:text-white">Billets d'avion</Link></li>
            <li><Link to="/hotels" className="hover:text-white">Hôtels</Link></li>
            <li><Link to="/visa" className="hover:text-white">Assistance visa</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-sky-400" /> {s.agency_address}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-sky-400" /> {s.agency_phone}</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-sky-400" /> {s.agency_email}</li>
            <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-sky-400" /> {s.agency_hours}</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-semibold text-white">Newsletter</h4>
          <p className="mb-4 text-sm text-sky-200">Recevez nos promotions et départs garantis en avant-première.</p>
          <Newsletter />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-sky-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {s.agency_name}. Tous droits réservés.</p>
          <p className="flex gap-4">
            <Link to="/a-propos" className="hover:text-white">À propos</Link>
            <Link to="/conditions" className="hover:text-white">Conditions générales de vente</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

function WhatsAppButton() {
  const s = useSettings()
  const number = (s.agency_whatsapp || '').replace(/\D/g, '')
  if (!number) return null
  return (
    <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:scale-105 no-print" aria-label="Nous écrire sur WhatsApp">
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
