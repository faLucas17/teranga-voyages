import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui'

/**
 * Protège un groupe de routes.
 *  <ProtectedRoute />               -> utilisateur connecté
 *  <ProtectedRoute staff />         -> admin ou agent
 *  <ProtectedRoute roles={['admin']} />
 */
export default function ProtectedRoute({ staff = false, roles }) {
  const { user, loading, isStaff } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname + location.search }} />
  if (staff && !isStaff) return <Navigate to="/compte" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/admin" replace />

  return <Outlet />
}
