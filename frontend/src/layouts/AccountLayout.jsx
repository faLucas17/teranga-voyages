import { NavLink, Outlet } from 'react-router-dom'
import { FileText, Heart, Luggage, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

const items = [
  { to: '/compte', label: 'Mes réservations', icon: Luggage, end: true },
  { to: '/compte/favoris', label: 'Mes favoris', icon: Heart },
  { to: '/compte/visas', label: 'Mes demandes de visa', icon: FileText },
  { to: '/compte/profil', label: 'Mon profil', icon: User },
]

export default function AccountLayout() {
  const { user } = useAuth()
  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="no-print">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bic-600 font-bold text-white">{initials(user?.name)}</div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <nav className="mt-5 flex flex-col gap-1">
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-sky-100 text-bic-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon className="h-4 w-4" /> {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <section className="min-w-0"><Outlet /></section>
      </div>
    </div>
  )
}
