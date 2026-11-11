import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Plane, Users } from 'lucide-react'
import { Badge, Img, Stars } from './ui'
import { date, duration, money, PACKAGE_TYPES, CABIN_CLASSES, time } from '../utils/format'

export function PackageCard({ pkg }) {
  const rating = pkg.approved_reviews_avg_rating
  const lowSeats = pkg.seats_available > 0 && pkg.seats_available <= 5
  return (
    <Link to={`/voyages/${pkg.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-52 overflow-hidden">
        <Img src={pkg.cover_image} alt={pkg.title} label={pkg.destination?.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <Badge className="absolute left-3 top-3 bg-white/95 text-bic-700">{PACKAGE_TYPES[pkg.type] || pkg.type}</Badge>
        {pkg.seats_available === 0 && <Badge className="absolute right-3 top-3 bg-red-600 text-white">Complet</Badge>}
        {lowSeats && <Badge className="absolute right-3 top-3 bg-amber-500 text-white">Plus que {pkg.seats_available} places</Badge>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1 text-xs font-medium text-sky-500">
          <MapPin className="h-3.5 w-3.5" /> {pkg.destination?.name}, {pkg.destination?.country}
        </p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900 group-hover:text-bic-600">{pkg.title}</h3>
        {pkg.summary && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{pkg.summary}</p>}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pkg.duration_days} jours</span>
          {pkg.start_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {date(pkg.start_date)}</span>}
          {rating ? <Stars value={rating} size="h-3.5 w-3.5" /> : null}
        </div>
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="text-xs text-slate-400">À partir de</p>
            <p className="text-xl font-extrabold text-bic-600">{money(pkg.price)}</p>
          </div>
          <span className="btn-light btn-sm">Voir le voyage</span>
        </div>
      </div>
    </Link>
  )
}

export function DestinationCard({ destination }) {
  return (
    <Link to={`/destinations/${destination.slug}`} className="group relative block h-72 overflow-hidden rounded-2xl shadow-card">
      <Img src={destination.image} alt={destination.name} label={destination.name} className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-bic-900/90 via-bic-900/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-xs font-medium uppercase tracking-widest text-sky-200">{destination.country}</p>
        <h3 className="text-2xl font-bold text-white">{destination.name}</h3>
        {destination.packages_min_price ? (
          <p className="mt-1 text-sm text-sky-100">Dès {money(destination.packages_min_price)}</p>
        ) : null}
      </div>
    </Link>
  )
}

export function HotelCard({ hotel }) {
  return (
    <div className="card flex flex-col overflow-hidden">
      <Img src={hotel.image} alt={hotel.name} label={hotel.name} className="h-48 w-full" />
      <div className="flex flex-1 flex-col p-5">
        <Stars value={hotel.stars} size="h-3.5 w-3.5" />
        <h3 className="mt-1 text-lg font-bold">{hotel.name}</h3>
        <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> {hotel.destination?.name}, {hotel.destination?.country}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(hotel.amenities || []).slice(0, 4).map((a) => (
            <span key={a} className="badge bg-sky-100 text-bic-700">{a}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="text-xs text-slate-400">Par nuit</p>
            <p className="text-xl font-extrabold text-bic-600">{money(hotel.price_per_night)}</p>
          </div>
          <Link to={`/reservation?type=hotel&slug=${hotel.slug}`} className="btn-primary btn-sm">Réserver</Link>
        </div>
      </div>
    </div>
  )
}

export function FlightRow({ flight, passengers = 1 }) {
  return (
    <div className="card flex flex-col gap-4 p-5 md:flex-row md:items-center">
      <div className="flex items-center gap-3 md:w-56">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-bic-600"><Plane className="h-5 w-5" /></div>
        <div>
          <p className="font-semibold">{flight.airline}</p>
          <p className="text-xs text-slate-500">{flight.flight_number} · {CABIN_CLASSES[flight.cabin_class]}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-between gap-4">
        <div className="text-center">
          <p className="text-xl font-bold">{time(flight.departure_at)}</p>
          <p className="text-xs text-slate-500">{flight.from_code} · {flight.from_city}</p>
        </div>
        <div className="flex flex-1 flex-col items-center text-xs text-slate-400">
          <span>{duration(flight.duration_minutes)}</span>
          <span className="my-1 h-px w-full bg-gradient-to-r from-sky-200 via-bic-400 to-sky-200" />
          <span>{date(flight.departure_at)}</span>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{time(flight.arrival_at)}</p>
          <p className="text-xs text-slate-500">{flight.to_code} · {flight.to_city}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 md:w-56 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-5 md:pt-0">
        <div className="md:text-right">
          <p className="text-xl font-extrabold text-bic-600">{money(flight.price)}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500"><Users className="h-3 w-3" /> {flight.seats_available} places · {flight.baggage}</p>
        </div>
        <Link to={`/reservation?type=flight&id=${flight.id}&adults=${passengers}`} className="btn-primary btn-sm">Choisir</Link>
      </div>
    </div>
  )
}
