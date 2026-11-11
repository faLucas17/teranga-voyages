<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\Coupon;
use App\Models\Destination;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\Review;
use App\Models\Setting;
use App\Models\TravelPackage;
use App\Models\User;
use App\Models\VisaRequest;
use App\Services\BookingService;
use App\Services\Payments\PaymentManager;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Mail;

/**
 * Données de démonstration réalistes (Sénégal / Afrique de l'Ouest).
 * Comptes créés :
 *   admin@teranga.sn  / password   (administrateur)
 *   agent@teranga.sn  / password   (agent)
 *   client@teranga.sn / password   (client)
 */
class DatabaseSeeder extends Seeder
{
    private function img(string $seed, int $w = 1200, int $h = 800): string
    {
        // Photos libres de démonstration : remplacez-les par vos propres visuels depuis le back-office.
        return "https://picsum.photos/seed/{$seed}/{$w}/{$h}";
    }

    public function run(): void
    {
        Mail::fake(); // pas d'envoi d'e-mails pendant le seed

        /* ------------------------------ Comptes ------------------------------ */
        $admin = User::factory()->admin()->create([
            'name' => 'Administrateur Teranga', 'email' => 'admin@teranga.sn',
        ]);
        User::factory()->agent()->create(['name' => 'Awa Ndiaye (Agent)', 'email' => 'agent@teranga.sn']);
        $client = User::factory()->create(['name' => 'Moussa Diop', 'email' => 'client@teranga.sn', 'phone' => '+221 77 123 45 67']);
        $clients = User::factory(12)->create();

        /* ---------------------------- Paramètres ----------------------------- */
        foreach ([
            'agency_name' => 'Teranga Voyages',
            'agency_slogan' => 'Voyagez avec l\'hospitalité sénégalaise',
            'agency_email' => 'contact@teranga-voyages.sn',
            'agency_phone' => '+221 33 800 00 00',
            'agency_whatsapp' => '+221 77 000 00 00',
            'agency_address' => 'Avenue Cheikh Anta Diop, Dakar, Sénégal',
            'agency_hours' => 'Lun - Sam : 8h30 - 19h00',
            'facebook_url' => 'https://facebook.com/',
            'instagram_url' => 'https://instagram.com/',
            'tiktok_url' => 'https://tiktok.com/',
            'bank_details' => 'Banque XYZ - IBAN SN00 0000 0000 0000 0000 0000 000',
        ] as $key => $value) {
            Setting::putValue($key, $value);
        }

        /* ---------------------------- Destinations --------------------------- */
        $destinations = collect([
            ['Saly', 'Sénégal', 'Afrique', 'Station balnéaire de la Petite-Côte : plages, golf, hôtels clubs et excursions à la réserve de Bandia.', 'Novembre à juin', true],
            ['Cap Skirring', 'Sénégal', 'Afrique', 'Plages de sable blanc de Casamance, villages de pêcheurs et forêts de palmiers.', 'Novembre à mai', true],
            ['Saint-Louis', 'Sénégal', 'Afrique', 'Ville coloniale classée au patrimoine mondial, Langue de Barbarie et parc du Djoudj.', 'Novembre à avril', false],
            ['Dubaï', 'Émirats arabes unis', 'Asie', 'Shopping, désert, gratte-ciel et plages : la destination préférée pour les séjours courts.', 'Octobre à avril', true],
            ['Istanbul', 'Turquie', 'Europe', 'Entre Europe et Asie : mosquées, bazars, Bosphore et gastronomie.', 'Avril à juin, septembre à novembre', true],
            ['La Mecque & Médine', 'Arabie saoudite', 'Asie', 'Pèlerinages Omra et Hajj encadrés : vols, hôtels proches du Haram, guide religieux.', 'Toute l\'année (Omra)', true],
            ['Marrakech', 'Maroc', 'Afrique', 'Médina, riads, jardins Majorelle et excursions dans l\'Atlas et le désert d\'Agafay.', 'Mars à mai, septembre à novembre', true],
            ['Paris', 'France', 'Europe', 'Musées, monuments, shopping et Disneyland : la capitale qui fait rêver.', 'Avril à octobre', false],
            ['Zanzibar', 'Tanzanie', 'Afrique', 'Eaux turquoise, Stone Town et plantations d\'épices.', 'Juin à octobre, décembre à février', true],
            ['Le Caire', 'Égypte', 'Afrique', 'Pyramides de Gizeh, musée égyptien et croisière sur le Nil.', 'Octobre à avril', false],
        ])->mapWithKeys(fn ($d) => [$d[0] => Destination::create([
            'name' => $d[0], 'country' => $d[1], 'continent' => $d[2], 'description' => $d[3],
            'best_period' => $d[4], 'is_featured' => $d[5],
            'image' => $this->img('dest-'.str($d[0])->slug()),
        ])]);

        /* ------------------------------ Forfaits ----------------------------- */
        $packages = [
            ['Omra Ramadan Confort', 'La Mecque & Médine', 'pelerinage', 15, 2350000, 1900000, 45, '+60 days',
                'Omra encadrée avec hôtels à moins de 500 m du Haram et visites guidées de Médine.',
                ['Billet d\'avion Dakar - Djeddah A/R', 'Visa Omra', 'Hôtels 4★ proches du Haram', 'Transferts en bus climatisé', 'Guide religieux', 'Ziyara à Médine'],
                ['Repas non mentionnés', 'Dépenses personnelles']],
            ['Dubaï Shopping & Désert', 'Dubaï', 'sejour', 7, 1150000, 850000, 30, '+25 days',
                'Une semaine entre Burj Khalifa, Dubai Mall, safari dans le désert et croisière Marina.',
                ['Vol A/R', 'Hôtel 4★ avec petit-déjeuner', 'Safari désert avec dîner', 'Croisière dhow', 'Visa touristique'],
                ['Entrée Burj Khalifa', 'Déjeuners et dîners']],
            ['Istanbul Impériale', 'Istanbul', 'circuit', 6, 890000, 650000, 25, '+40 days',
                'Sainte-Sophie, Mosquée bleue, Grand Bazar et croisière sur le Bosphore.',
                ['Vol A/R', 'Hôtel 4★ centre historique', 'Petits-déjeuners', 'Croisière Bosphore', 'Guide francophone 2 jours'],
                ['Visa (e-visa à la charge du client)', 'Repas libres']],
            ['Saly Week-end Détente', 'Saly', 'weekend', 3, 145000, 75000, 40, '+10 days',
                'Week-end en hôtel club tout compris avec piscine, plage privée et animations.',
                ['Transport A/R depuis Dakar', 'Hôtel club 4★ tout compris', 'Accès piscine & plage'],
                ['Excursion Bandia (en option)']],
            ['Cap Skirring Évasion', 'Cap Skirring', 'sejour', 5, 420000, 250000, 20, '+30 days',
                'Plages paradisiaques, pirogue dans les bolongs et découverte de la culture diola.',
                ['Vol Dakar - Cap Skirring A/R', 'Hôtel 3★ demi-pension', 'Balade en pirogue', 'Visite d\'Oussouye'],
                ['Boissons', 'Pourboires']],
            ['Marrakech Mille et Une Nuits', 'Marrakech', 'sejour', 6, 720000, 500000, 24, '+35 days',
                'Riad au cœur de la médina, souks, Jardin Majorelle et nuit dans le désert d\'Agafay.',
                ['Vol A/R', 'Riad avec petit-déjeuner', 'Nuit sous tente à Agafay', 'Visite guidée de la médina'],
                ['Repas libres', 'Hammam']],
            ['Zanzibar Lune de Miel', 'Zanzibar', 'sejour', 8, 1650000, null, 12, '+50 days',
                'Séjour romantique en bungalow face à l\'océan Indien, Stone Town et excursion aux dauphins.',
                ['Vol A/R', 'Resort 5★ demi-pension', 'Dîner romantique', 'Excursion Stone Town', 'Snorkeling'],
                ['Visa (à l\'arrivée)', 'Assurance voyage']],
            ['Égypte : Pyramides & Croisière', 'Le Caire', 'croisiere', 9, 1490000, 1100000, 28, '+70 days',
                'Le Caire, Gizeh puis croisière 4 jours sur le Nil de Louxor à Assouan.',
                ['Vols internationaux et intérieurs', 'Croisière 5★ pension complète', 'Hôtel au Caire', 'Guide égyptologue'],
                ['Visa', 'Pourboires obligatoires']],
            ['Paris & Disneyland Famille', 'Paris', 'sejour', 7, 1380000, 990000, 20, '+80 days',
                'Une semaine en famille : Tour Eiffel, croisière sur la Seine et 2 jours à Disneyland.',
                ['Vol A/R', 'Hôtel 3★', 'Billets Disneyland 2 jours', 'Croisière Bateaux-Mouches', 'Pass transport'],
                ['Visa Schengen', 'Repas']],
            ['Saint-Louis & Djoudj', 'Saint-Louis', 'circuit', 3, 185000, 110000, 30, '+15 days',
                'Calèche dans l\'île, Langue de Barbarie et parc ornithologique du Djoudj.',
                ['Transport A/R', 'Hôtel 3★ avec petit-déjeuner', 'Entrée parc du Djoudj', 'Guide local'],
                ['Déjeuners']],
        ];

        $createdPackages = collect();
        foreach ($packages as $i => [$title, $dest, $type, $days, $price, $child, $seats, $offset, $summary, $inc, $exc]) {
            $start = now()->modify($offset)->startOfDay();
            $itinerary = collect(range(1, min($days, 6)))->map(fn ($d) => [
                'day' => $d,
                'title' => match (true) {
                    $d === 1 => 'Départ de Dakar et arrivée',
                    $d === min($days, 6) => 'Temps libre et retour',
                    default => "Découverte - jour {$d}",
                },
                'description' => $d === 1
                    ? 'Rendez-vous à l\'aéroport AIBD, accueil à destination et transfert à l\'hôtel.'
                    : 'Visites guidées selon le programme, temps libre et soirée à votre rythme.',
            ])->all();

            $createdPackages->push(TravelPackage::create([
                'destination_id' => $destinations[$dest]->id,
                'title' => $title,
                'type' => $type,
                'summary' => $summary,
                'description' => $summary."\n\nCe voyage est organisé par nos conseillers à Dakar. Accompagnement de A à Z : formalités, assurance, transferts et assistance 24h/24 pendant le séjour.",
                'itinerary' => $itinerary,
                'included' => $inc,
                'excluded' => $exc,
                'cover_image' => $this->img('pkg-'.($i + 1)),
                'gallery' => [$this->img('pkg-'.($i + 1).'-a'), $this->img('pkg-'.($i + 1).'-b'), $this->img('pkg-'.($i + 1).'-c')],
                'duration_days' => $days,
                'departure_city' => 'Dakar',
                'start_date' => $start,
                'end_date' => (clone $start)->addDays($days - 1),
                'price' => $price,
                'child_price' => $child,
                'seats_total' => $seats,
                'seats_available' => $seats,
                'is_featured' => $i < 6,
            ]));
        }

        /* ------------------------------- Hôtels ------------------------------ */
        $hotels = [
            ['Saly', 'Lamantin Beach Resort', 5, 95000, ['Piscine', 'Spa', 'Plage privée', 'Wi-Fi', 'Restaurant']],
            ['Saly', 'Royal Saly Club', 4, 62000, ['Piscine', 'Tout compris', 'Animation', 'Wi-Fi']],
            ['Cap Skirring', 'Hôtel La Paillote', 3, 48000, ['Plage', 'Restaurant', 'Wi-Fi']],
            ['Saint-Louis', 'Hôtel de la Poste', 3, 42000, ['Historique', 'Restaurant', 'Wi-Fi', 'Climatisation']],
            ['Dubaï', 'Marina Bay Suites', 4, 120000, ['Piscine', 'Vue mer', 'Salle de sport', 'Wi-Fi']],
            ['Istanbul', 'Sultanahmet Palace', 4, 78000, ['Petit-déjeuner', 'Terrasse', 'Wi-Fi']],
            ['La Mecque & Médine', 'Al Haram Towers', 4, 135000, ['À 300 m du Haram', 'Petit-déjeuner', 'Navette']],
            ['Marrakech', 'Riad Yasmine', 4, 70000, ['Patio', 'Piscine', 'Hammam', 'Petit-déjeuner']],
            ['Zanzibar', 'Nungwi Ocean Villas', 5, 160000, ['Front de mer', 'Spa', 'Plongée', 'Demi-pension']],
            ['Paris', 'Hôtel Lumière Opéra', 3, 115000, ['Centre-ville', 'Wi-Fi', 'Petit-déjeuner']],
        ];
        foreach ($hotels as $i => [$dest, $name, $stars, $price, $amenities]) {
            Hotel::create([
                'destination_id' => $destinations[$dest]->id,
                'name' => $name,
                'stars' => $stars,
                'address' => $destinations[$dest]->name.', '.$destinations[$dest]->country,
                'description' => "Établissement {$stars} étoiles sélectionné par nos conseillers pour son confort et son emplacement.",
                'amenities' => $amenities,
                'image' => $this->img('hotel-'.($i + 1)),
                'price_per_night' => $price,
                'rooms_available' => 15,
            ]);
        }

        /* -------------------------------- Vols ------------------------------- */
        $routes = [
            ['Air Sénégal', 'HC', 'Paris', 'CDG', 6 * 60 + 10, 485000],
            ['Turkish Airlines', 'TK', 'Istanbul', 'IST', 7 * 60 + 5, 520000],
            ['Emirates', 'EK', 'Dubaï', 'DXB', 9 * 60 + 40, 610000],
            ['Royal Air Maroc', 'AT', 'Casablanca', 'CMN', 3 * 60 + 20, 310000],
            ['Saudia', 'SV', 'Djeddah', 'JED', 7 * 60 + 30, 590000],
            ['Air Côte d\'Ivoire', 'HF', 'Abidjan', 'ABJ', 2 * 60 + 45, 260000],
            ['Air Sénégal', 'HC', 'Ziguinchor', 'ZIG', 60, 75000],
            ['Brussels Airlines', 'SN', 'Bruxelles', 'BRU', 6 * 60 + 25, 495000],
        ];
        foreach ($routes as $r => [$airline, $code, $city, $iata, $minutes, $price]) {
            foreach ([5, 12, 19, 26, 40] as $k => $days) {
                $dep = now()->addDays($days + $r)->setTime(8 + ($k * 3) % 14, 30);
                foreach (['economy' => 1, 'business' => 2.6] as $class => $factor) {
                    Flight::create([
                        'airline' => $airline,
                        'flight_number' => $code.' '.(300 + $r * 10 + $k),
                        'from_city' => 'Dakar', 'from_code' => 'DSS',
                        'to_city' => $city, 'to_code' => $iata,
                        'departure_at' => $dep,
                        'arrival_at' => (clone $dep)->addMinutes($minutes),
                        'cabin_class' => $class,
                        'price' => (int) round($price * $factor, -3),
                        'seats_available' => $class === 'economy' ? 60 : 12,
                        'baggage' => $class === 'economy' ? '1 bagage 23 kg' : '2 bagages 32 kg',
                    ]);
                }
            }
        }

        /* ---------------------------- Codes promo ---------------------------- */
        Coupon::create(['code' => 'TERANGA10', 'description' => '10 % de réduction de bienvenue', 'type' => 'percent', 'value' => 10, 'max_uses' => 500]);
        Coupon::create(['code' => 'TABASKI50', 'description' => '50 000 FCFA offerts dès 500 000 FCFA', 'type' => 'fixed', 'value' => 50000, 'min_amount' => 500000, 'expires_at' => now()->addMonths(3)]);

        /* ------------------------ Réservations & avis ------------------------ */
        $bookingService = app(BookingService::class);
        $paymentManager = app(PaymentManager::class);
        $methods = ['wave', 'orange_money', 'card'];

        foreach ($clients->push($client) as $i => $user) {
            $package = $createdPackages[$i % $createdPackages->count()];
            $booking = $bookingService->create($user, [
                'bookable_type' => 'package',
                'bookable_id' => $package->id,
                'adults' => 1 + $i % 3,
                'children' => $i % 2,
                'travelers' => [['first_name' => explode(' ', $user->name)[0], 'last_name' => explode(' ', $user->name)[1] ?? 'Client', 'type' => 'adult', 'nationality' => 'Sénégalaise']],
            ]);

            if ($i % 4 !== 3) {
                $paymentManager->pay($booking, $methods[$i % 3], $user->phone);
            }

            Review::create([
                'user_id' => $user->id,
                'travel_package_id' => $package->id,
                'rating' => [5, 5, 4, 5, 4][$i % 5],
                'title' => ['Inoubliable !', 'Organisation parfaite', 'Très bon séjour', 'Je recommande', 'Super équipe'][$i % 5],
                'comment' => [
                    'Tout était parfaitement organisé, de l\'aéroport jusqu\'à l\'hôtel. Merci à toute l\'équipe !',
                    'Guide très professionnel et hôtel conforme à la description. Nous repartirons avec Teranga.',
                    'Très bon rapport qualité-prix, quelques retards de transfert mais l\'agence a bien géré.',
                    'Service client réactif sur WhatsApp, paiement Wave très pratique. Je recommande.',
                    'Un voyage magique en famille, les enfants ont adoré.',
                ][$i % 5],
                'is_approved' => $i % 6 !== 5,
            ]);
        }

        /* --------------------------- Divers démo ----------------------------- */
        ContactMessage::create(['name' => 'Fatou Sow', 'email' => 'fatou@example.com', 'phone' => '+221 76 000 11 22', 'subject' => 'Devis groupe', 'message' => 'Bonjour, je souhaite un devis pour un voyage de groupe de 15 personnes à Istanbul en mars.']);
        VisaRequest::create(['user_id' => $client->id, 'full_name' => 'Moussa Diop', 'email' => 'client@teranga.sn', 'phone' => '+221 77 123 45 67', 'destination_country' => 'France', 'visa_type' => 'tourisme', 'travel_date' => now()->addMonths(2), 'message' => 'Visa Schengen court séjour pour vacances.']);
    }
}
