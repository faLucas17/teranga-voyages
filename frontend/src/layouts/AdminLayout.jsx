import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, Building2, CreditCard, ExternalLink, FileText, Globe, LayoutDashboard, LogOut,
  Mail, Menu, MessageSquare, Plane, Settings, Tag, Ticket, Users, X, Luggage,
} from 'lucide-react'
import { Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

const groups = [
  { title: 'Pilotage', items: [{ to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
  {
    title: 'Ventes',
    items: [
      { to: '/admin/reservations', label: 'Réservations', icon: Ticket },
      { to: '/admin/paiements', label: 'Paiements', icon: CreditCard },
      { to: '/admin/codes-promo', label: 'Codes promo', icon: Tag },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { to: '/admin/voyages', label: 'Voyages', icon: Luggage },
      { to: '/admin/destinations', label: 'Destinations', icon: Globe },
      { to: '/admin/hotels', label: 'Hôtels', icon: Building2 },
      { to: '/admin/vols', label: 'Vols', icon: Plane },
    ],
  },
  {
    title: 'Relation client',
    items: [
      { to: '/admin/visas', label: 'Demandes de visa', icon: FileText },
      { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
      { to: '/admin/avis', label: 'Avis clients', icon: BadgeCheck },
      { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    ],
  },
  {
    title: 'Administration',
    adminOnly: true,
    items: [
      { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
      { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
]

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/admin"><Logo light size="sm" /></Link>
        <button className="text-sky-200 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {groups.filter((g) => !g.adminOnly || isAdmin).map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sky-300/70">{g.title}</p>
            {g.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white text-bic-700' : 'text-sky-100 hover:bg-white/10'}`}>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link to="/" className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-sky-100 hover:bg-white/10"><ExternalLink className="h-4 w-4" /> Voir le site</Link>
        <button onClick={async () => { await logout(); navigate('/') }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sky-100 hover:bg-white/10"><LogOut className="h-4 w-4" /> Déconnexion</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-gradient-to-b from-bic-700 to-bic-900 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-bic-700 to-bic-900">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <p className="hidden text-sm text-slate-500 sm:block">Back-office · {user?.role === 'admin' ? 'Administrateur' : 'Agent'}</p>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bic-600 text-sm font-bold text-white">{initials(user?.name)}</div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
