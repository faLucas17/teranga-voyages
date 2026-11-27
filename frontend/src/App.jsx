import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import PublicLayout from './layouts/PublicLayout'
import AccountLayout from './layouts/AccountLayout'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/ui'

import Home from './pages/Home'
import Packages from './pages/Packages'
import PackageDetail from './pages/PackageDetail'
import { Destinations, DestinationDetail } from './pages/Destinations'
import Hotels from './pages/Hotels'
import Flights from './pages/Flights'
import Booking from './pages/Booking'
import { About, Contact, NotFound, Terms, Visa } from './pages/Static'
import { ForgotPassword, Login, Register, ResetPassword } from './pages/Auth'
import { Favorites, MyBookings, MyVisas, Profile } from './pages/account/Account'
import BookingDetail from './pages/account/BookingDetail'

// Le back-office est chargé à la demande (les clients ne le téléchargent jamais)
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const admin = (name) => lazy(() => import('./pages/admin/CatalogPages').then((m) => ({ default: m[name] })))
const bookings = (name) => lazy(() => import('./pages/admin/Bookings').then((m) => ({ default: m[name] })))
const inbox = (name) => lazy(() => import('./pages/admin/Inbox').then((m) => ({ default: m[name] })))

const AdminPackages = admin('AdminPackages')
const AdminDestinations = admin('AdminDestinations')
const AdminHotels = admin('AdminHotels')
const AdminFlights = admin('AdminFlights')
const AdminCoupons = admin('AdminCoupons')
const AdminUsers = admin('AdminUsers')
const AdminBookings = bookings('AdminBookings')
const AdminBookingShow = bookings('AdminBookingShow')
const AdminPayments = bookings('AdminPayments')
const AdminReviews = inbox('AdminReviews')
const AdminMessages = inbox('AdminMessages')
const AdminVisas = inbox('AdminVisas')
const AdminNewsletter = inbox('AdminNewsletter')
const AdminSettings = inbox('AdminSettings')

export default function App() {
  const location = useLocation()
  return (
    <ErrorBoundary resetKey={location.pathname}>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Site public */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="voyages" element={<Packages />} />
          <Route path="voyages/:slug" element={<PackageDetail />} />
          <Route path="destinations" element={<Destinations />} />
          <Route path="destinations/:slug" element={<DestinationDetail />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="vols" element={<Flights />} />
          <Route path="visa" element={<Visa />} />
          <Route path="contact" element={<Contact />} />
          <Route path="a-propos" element={<About />} />
          <Route path="conditions" element={<Terms />} />
          <Route path="connexion" element={<Login />} />
          <Route path="inscription" element={<Register />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="reinitialiser-mot-de-passe" element={<ResetPassword />} />

          {/* Espace client */}
          <Route element={<ProtectedRoute />}>
            <Route path="reservation" element={<Booking />} />
            <Route path="compte" element={<AccountLayout />}>
              <Route index element={<MyBookings />} />
              <Route path="reservations/:id" element={<BookingDetail />} />
              <Route path="favoris" element={<Favorites />} />
              <Route path="visas" element={<MyVisas />} />
              <Route path="profil" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Back-office (admin + agents) */}
        <Route element={<ProtectedRoute staff />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="reservations" element={<AdminBookings />} />
            <Route path="reservations/:id" element={<AdminBookingShow />} />
            <Route path="paiements" element={<AdminPayments />} />
            <Route path="codes-promo" element={<AdminCoupons />} />
            <Route path="voyages" element={<AdminPackages />} />
            <Route path="destinations" element={<AdminDestinations />} />
            <Route path="hotels" element={<AdminHotels />} />
            <Route path="vols" element={<AdminFlights />} />
            <Route path="visas" element={<AdminVisas />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="avis" element={<AdminReviews />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="utilisateurs" element={<AdminUsers />} />
              <Route path="parametres" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
    </ErrorBoundary>
  )
}