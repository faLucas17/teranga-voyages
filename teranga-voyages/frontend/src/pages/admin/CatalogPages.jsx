import api from '../../api/client'
import { Badge, Img, StatusBadge } from '../../components/ui'
import { CABIN_CLASSES, PACKAGE_TYPES, date, dateTime, money } from '../../utils/format'
import ResourcePage from './ResourcePage'

const toOptions = (obj) => Object.entries(obj).map(([value, label]) => ({ value, label }))
const ACTIVE = { true: { label: 'Actif', className: 'bg-emerald-100 text-emerald-700' }, false: { label: 'Masqué', className: 'bg-slate-100 text-slate-600' } }
const activeBadge = (item) => <StatusBadge map={ACTIVE} value={String(Boolean(item.is_active))} />
const yesNo = [{ value: '1', label: 'Oui' }, { value: '0', label: 'Non' }]

/** Charge la liste des destinations pour les listes déroulantes */
const destinationOptions = async () => {
  const { data } = await api.get('/admin/destinations', { params: { per_page: 100, sort: 'name', direction: 'asc' } })
  return { destination_id: data.data.map((d) => ({ value: String(d.id), label: `${d.name} (${d.country})` })) }
}

export function AdminPackages() {
  return (
    <ResourcePage
      title="Voyages"
      subtitle="Séjours, circuits, pèlerinages... Les voyages actifs apparaissent sur le site."
      endpoint="/admin/packages"
      optionsLoader={destinationOptions}
      filters={[
        { name: 'type', label: 'Tous les types', options: toOptions(PACKAGE_TYPES) },
        { name: 'is_active', label: 'Visibilité', options: [{ value: '1', label: 'Actifs' }, { value: '0', label: 'Masqués' }] },
      ]}
      columns={[
        { key: 'title', label: 'Voyage', render: (p) => (
          <div className="flex items-center gap-3">
            <Img src={p.cover_image} className="h-10 w-14 rounded-lg" label="" />
            <div><p className="font-semibold text-slate-900">{p.title}</p><p className="text-xs text-slate-500">{p.destination?.name}</p></div>
          </div>
        ) },
        { key: 'type', label: 'Type', render: (p) => <Badge className="bg-sky-100 text-bic-700">{PACKAGE_TYPES[p.type]}</Badge> },
        { key: 'start_date', label: 'Départ', render: (p) => date(p.start_date) },
        { key: 'price', label: 'Prix', render: (p) => money(p.price) },
        { key: 'seats', label: 'Places', render: (p) => `${p.seats_available} / ${p.seats_total}` },
        { key: 'is_active', label: 'Statut', render: activeBadge },
      ]}
      fields={[
        { name: 'title', label: 'Titre', required: true, full: true },
        { name: 'destination_id', label: 'Destination', type: 'select', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: toOptions(PACKAGE_TYPES), default: 'sejour' },
        { name: 'price', label: 'Prix adulte (FCFA)', type: 'number', required: true },
        { name: 'child_price', label: 'Prix enfant (FCFA)', type: 'number' },
        { name: 'duration_days', label: 'Durée (jours)', type: 'number', required: true, min: 1, default: 7 },
        { name: 'departure_city', label: 'Ville de départ', default: 'Dakar' },
        { name: 'start_date', label: 'Date de départ', type: 'date' },
        { name: 'end_date', label: 'Date de retour', type: 'date' },
        { name: 'seats_total', label: 'Places totales', type: 'number', required: true, default: 20 },
        { name: 'seats_available', label: 'Places disponibles', type: 'number' },
        { name: 'cover_image', label: 'Image de couverture', type: 'image', full: true },
        { name: 'summary', label: 'Résumé (affiché sur les cartes)', full: true },
        { name: 'description', label: 'Description complète', type: 'textarea' },
        { name: 'itinerary', label: 'Programme (jour | titre | description)', type: 'itinerary' },
        { name: 'included', label: 'Inclus (un par ligne)', type: 'list' },
        { name: 'excluded', label: 'Non inclus (un par ligne)', type: 'list' },
        { name: 'gallery', label: 'Galerie photos (une URL par ligne)', type: 'list' },
        { name: 'is_featured', label: 'Mis en avant', type: 'checkbox', hint: 'Afficher sur la page d\'accueil' },
        { name: 'is_active', label: 'Visible', type: 'checkbox', hint: 'Publié sur le site', default: true },
      ]}
    />
  )
}

export function AdminDestinations() {
  return (
    <ResourcePage
      title="Destinations"
      endpoint="/admin/destinations"
      filters={[{ name: 'is_featured', label: 'Mise en avant', options: yesNo }]}
      columns={[
        { key: 'name', label: 'Destination', render: (d) => (
          <div className="flex items-center gap-3">
            <Img src={d.image} className="h-10 w-14 rounded-lg" label="" />
            <div><p className="font-semibold text-slate-900">{d.name}</p><p className="text-xs text-slate-500">{d.country}</p></div>
          </div>
        ) },
        { key: 'continent', label: 'Continent' },
        { key: 'packages_count', label: 'Voyages' },
        { key: 'hotels_count', label: 'Hôtels' },
        { key: 'is_featured', label: 'À la une', render: (d) => (d.is_featured ? '★' : '') },
        { key: 'is_active', label: 'Statut', render: activeBadge },
      ]}
      fields={[
        { name: 'name', label: 'Nom', required: true },
        { name: 'country', label: 'Pays', required: true },
        { name: 'continent', label: 'Continent', type: 'select', options: ['Afrique', 'Europe', 'Asie', 'Amérique', 'Océanie'].map((c) => ({ value: c, label: c })) },
        { name: 'best_period', label: 'Meilleure période' },
        { name: 'image', label: 'Image', type: 'image', full: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'is_featured', label: 'Mise en avant', type: 'checkbox' },
        { name: 'is_active', label: 'Visible', type: 'checkbox', default: true },
      ]}
    />
  )
}

export function AdminHotels() {
  return (
    <ResourcePage
      title="Hôtels"
      endpoint="/admin/hotels"
      optionsLoader={destinationOptions}
      columns={[
        { key: 'name', label: 'Hôtel', render: (h) => (
          <div><p className="font-semibold text-slate-900">{h.name}</p><p className="text-xs text-slate-500">{h.destination?.name}</p></div>
        ) },
        { key: 'stars', label: 'Catégorie', render: (h) => '★'.repeat(h.stars) },
        { key: 'price_per_night', label: 'Prix / nuit', render: (h) => money(h.price_per_night) },
        { key: 'rooms_available', label: 'Chambres dispo.' },
        { key: 'is_active', label: 'Statut', render: activeBadge },
      ]}
      fields={[
        { name: 'name', label: 'Nom', required: true },
        { name: 'destination_id', label: 'Destination', type: 'select', required: true },
        { name: 'stars', label: 'Étoiles', type: 'number', required: true, min: 1, default: 3 },
        { name: 'price_per_night', label: 'Prix par nuit (FCFA)', type: 'number', required: true },
        { name: 'rooms_available', label: 'Chambres disponibles', type: 'number', required: true, default: 10 },
        { name: 'address', label: 'Adresse' },
        { name: 'image', label: 'Image', type: 'image', full: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'amenities', label: 'Équipements (un par ligne)', type: 'list' },
        { name: 'is_active', label: 'Visible', type: 'checkbox', default: true },
      ]}
    />
  )
}

export function AdminFlights() {
  return (
    <ResourcePage
      title="Vols"
      subtitle="Vols proposés à la réservation (stock négocié ou vols de groupe)."
      endpoint="/admin/flights"
      searchPlaceholder="Compagnie, ville, code IATA..."
      filters={[{ name: 'cabin_class', label: 'Toutes classes', options: toOptions(CABIN_CLASSES) }]}
      columns={[
        { key: 'flight_number', label: 'Vol', render: (f) => <div><p className="font-semibold">{f.airline}</p><p className="text-xs text-slate-500">{f.flight_number}</p></div> },
        { key: 'route', label: 'Trajet', render: (f) => `${f.from_code} → ${f.to_code}` },
        { key: 'departure_at', label: 'Départ', render: (f) => dateTime(f.departure_at) },
        { key: 'cabin_class', label: 'Classe', render: (f) => CABIN_CLASSES[f.cabin_class] },
        { key: 'price', label: 'Prix', render: (f) => money(f.price) },
        { key: 'seats_available', label: 'Sièges' },
      ]}
      fields={[
        { name: 'airline', label: 'Compagnie', required: true },
        { name: 'flight_number', label: 'N° de vol', required: true },
        { name: 'from_city', label: 'Ville de départ', required: true, default: 'Dakar' },
        { name: 'from_code', label: 'Code IATA départ', required: true, default: 'DSS' },
        { name: 'to_city', label: 'Ville d\'arrivée', required: true },
        { name: 'to_code', label: 'Code IATA arrivée', required: true },
        { name: 'departure_at', label: 'Départ', type: 'datetime', required: true },
        { name: 'arrival_at', label: 'Arrivée', type: 'datetime', required: true },
        { name: 'cabin_class', label: 'Classe', type: 'select', required: true, options: toOptions(CABIN_CLASSES), default: 'economy' },
        { name: 'price', label: 'Prix adulte (FCFA)', type: 'number', required: true },
        { name: 'seats_available', label: 'Sièges disponibles', type: 'number', required: true, default: 50 },
        { name: 'baggage', label: 'Bagages', default: '1 bagage 23 kg' },
        { name: 'is_active', label: 'Visible', type: 'checkbox', default: true },
      ]}
    />
  )
}

export function AdminCoupons() {
  return (
    <ResourcePage
      title="Codes promo"
      endpoint="/admin/coupons"
      columns={[
        { key: 'code', label: 'Code', render: (c) => <span className="font-mono font-bold text-bic-600">{c.code}</span> },
        { key: 'value', label: 'Réduction', render: (c) => (c.type === 'percent' ? `${c.value} %` : money(c.value)) },
        { key: 'min_amount', label: 'Minimum', render: (c) => (c.min_amount ? money(c.min_amount) : '—') },
        { key: 'used', label: 'Utilisations', render: (c) => `${c.used_count}${c.max_uses ? ' / ' + c.max_uses : ''}` },
        { key: 'expires_at', label: 'Expire le', render: (c) => date(c.expires_at) },
        { key: 'is_active', label: 'Statut', render: activeBadge },
      ]}
      fields={[
        { name: 'code', label: 'Code', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, default: 'percent', options: [{ value: 'percent', label: 'Pourcentage' }, { value: 'fixed', label: 'Montant fixe (FCFA)' }] },
        { name: 'value', label: 'Valeur', type: 'number', required: true },
        { name: 'min_amount', label: 'Montant minimum (FCFA)', type: 'number' },
        { name: 'max_uses', label: 'Utilisations max', type: 'number' },
        { name: 'expires_at', label: 'Date d\'expiration', type: 'datetime' },
        { name: 'description', label: 'Description', full: true },
        { name: 'is_active', label: 'Actif', type: 'checkbox', default: true },
      ]}
    />
  )
}

const ROLES = { admin: 'Administrateur', agent: 'Agent', client: 'Client' }

export function AdminUsers() {
  return (
    <ResourcePage
      title="Utilisateurs"
      subtitle="Clients, agents et administrateurs."
      endpoint="/admin/users"
      filters={[{ name: 'role', label: 'Tous les rôles', options: toOptions(ROLES) }]}
      columns={[
        { key: 'name', label: 'Nom', render: (u) => <div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div> },
        { key: 'phone', label: 'Téléphone' },
        { key: 'role', label: 'Rôle', render: (u) => <Badge className={u.role === 'client' ? 'bg-slate-100 text-slate-700' : 'bg-bic-100 text-bic-700'}>{ROLES[u.role]}</Badge> },
        { key: 'bookings_count', label: 'Réservations' },
        { key: 'total_spent', label: 'Dépensé', render: (u) => money(u.total_spent || 0) },
        { key: 'is_active', label: 'Compte', render: activeBadge },
      ]}
      fields={[
        { name: 'name', label: 'Nom', required: true },
        { name: 'email', label: 'E-mail', required: true, inputType: 'email' },
        { name: 'phone', label: 'Téléphone' },
        { name: 'role', label: 'Rôle', type: 'select', required: true, options: toOptions(ROLES), default: 'client' },
        { name: 'password', label: 'Mot de passe', type: 'password', placeholder: 'Laisser vide pour ne pas changer' },
        { name: 'is_active', label: 'Compte actif', type: 'checkbox', default: true },
      ]}
    />
  )
}
