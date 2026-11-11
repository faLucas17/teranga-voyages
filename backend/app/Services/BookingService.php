<?php

namespace App\Services;

use App\Mail\BookingMail;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\Flight;
use App\Models\Hotel;
use App\Models\TravelPackage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

/**
 * Logique métier des réservations : calcul du prix, contrôle des places,
 * application des codes promo, création transactionnelle.
 */
class BookingService
{
    public const TYPES = [
        'package' => TravelPackage::class,
        'hotel' => Hotel::class,
        'flight' => Flight::class,
    ];

    public function resolveItem(string $type, int $id, bool $lock = false): Model
    {
        $class = self::TYPES[$type] ?? throw ValidationException::withMessages([
            'bookable_type' => 'Type de réservation invalide.',
        ]);

        $query = $class::query()->where('is_active', true)->whereKey($id);
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first() ?? throw ValidationException::withMessages([
            'bookable_id' => 'Cette offre est introuvable ou n\'est plus disponible.',
        ]);
    }

    /**
     * Calcule le devis d'une réservation (sans l'enregistrer).
     *
     * @return array{subtotal:int, discount:int, total:int, coupon:?Coupon, start_date:?string, end_date:?string, meta:array, lines:array}
     */
    public function quote(string $type, Model $item, array $data): array
    {
        $adults = max(1, (int) ($data['adults'] ?? 1));
        $children = max(0, (int) ($data['children'] ?? 0));
        $meta = [];
        $lines = [];

        switch ($type) {
            case 'package':
                /** @var TravelPackage $item */
                $this->ensureSeats($item->seats_available, $adults + $children);
                $lines[] = ['label' => "Adulte × {$adults}", 'amount' => $adults * $item->price];
                if ($children > 0) {
                    $lines[] = ['label' => "Enfant × {$children}", 'amount' => $children * $item->effectiveChildPrice()];
                }
                $start = $item->start_date?->toDateString() ?? ($data['start_date'] ?? null);
                $end = $item->end_date?->toDateString()
                    ?? ($start ? Carbon::parse($start)->addDays(max(0, $item->duration_days - 1))->toDateString() : null);
                break;

            case 'hotel':
                /** @var Hotel $item */
                if (empty($data['start_date']) || empty($data['end_date'])) {
                    throw ValidationException::withMessages(['start_date' => 'Les dates d\'arrivée et de départ sont obligatoires.']);
                }
                $start = Carbon::parse($data['start_date'])->toDateString();
                $end = Carbon::parse($data['end_date'])->toDateString();
                $nights = (int) Carbon::parse($start)->diffInDays(Carbon::parse($end));
                if ($nights < 1) {
                    throw ValidationException::withMessages(['end_date' => 'La date de départ doit être après la date d\'arrivée.']);
                }
                $rooms = max(1, (int) ($data['rooms'] ?? ceil(($adults + $children) / 2)));
                if ($item->rooms_available < $rooms) {
                    throw ValidationException::withMessages(['rooms' => "Il ne reste que {$item->rooms_available} chambre(s) disponible(s)."]);
                }
                $meta = ['rooms' => $rooms, 'nights' => $nights];
                $lines[] = ['label' => "{$rooms} chambre(s) × {$nights} nuit(s)", 'amount' => $rooms * $nights * $item->price_per_night];
                break;

            case 'flight':
                /** @var Flight $item */
                $this->ensureSeats($item->seats_available, $adults + $children);
                $childPrice = (int) round($item->price * config('agency.flight_child_ratio', 0.75));
                $lines[] = ['label' => "Adulte × {$adults}", 'amount' => $adults * $item->price];
                if ($children > 0) {
                    $lines[] = ['label' => "Enfant × {$children}", 'amount' => $children * $childPrice];
                }
                $start = $item->departure_at->toDateString();
                $end = $item->arrival_at->toDateString();
                break;

            default:
                throw ValidationException::withMessages(['bookable_type' => 'Type de réservation invalide.']);
        }

        $subtotal = (int) array_sum(array_column($lines, 'amount'));
        $coupon = null;
        $discount = 0;

        if (! empty($data['coupon_code'])) {
            $coupon = Coupon::where('code', strtoupper(trim($data['coupon_code'])))->first();
            if (! $coupon) {
                throw ValidationException::withMessages(['coupon_code' => 'Code promo inconnu.']);
            }
            if ($error = $coupon->validationError($subtotal)) {
                throw ValidationException::withMessages(['coupon_code' => $error]);
            }
            $discount = $coupon->discountFor($subtotal);
        }

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'total' => $subtotal - $discount,
            'coupon' => $coupon,
            'start_date' => $start ?? null,
            'end_date' => $end ?? null,
            'meta' => $meta,
            'lines' => $lines,
        ];
    }

    /**
     * Crée la réservation, les voyageurs et réserve les places (transaction + verrou).
     */
    public function create(User $user, array $data): Booking
    {
        $booking = DB::transaction(function () use ($user, $data) {
            $type = $data['bookable_type'];
            $item = $this->resolveItem($type, (int) $data['bookable_id'], lock: true);
            $quote = $this->quote($type, $item, $data);

            $booking = Booking::create([
                'user_id' => $user->id,
                'bookable_type' => $type,
                'bookable_id' => $item->getKey(),
                'start_date' => $quote['start_date'],
                'end_date' => $quote['end_date'],
                'adults' => (int) ($data['adults'] ?? 1),
                'children' => (int) ($data['children'] ?? 0),
                'subtotal' => $quote['subtotal'],
                'discount' => $quote['discount'],
                'total' => $quote['total'],
                'currency' => config('agency.currency', 'XOF'),
                'status' => Booking::STATUS_PENDING,
                'coupon_id' => $quote['coupon']?->id,
                'contact_name' => $data['contact_name'] ?? $user->name,
                'contact_email' => $data['contact_email'] ?? $user->email,
                'contact_phone' => $data['contact_phone'] ?? $user->phone,
                'special_requests' => $data['special_requests'] ?? null,
                'meta' => array_merge($quote['meta'], ['lines' => $quote['lines']]),
            ]);

            foreach ($data['travelers'] ?? [] as $traveler) {
                $booking->travelers()->create($traveler);
            }

            $seats = $booking->adults + $booking->children;
            match ($type) {
                'package', 'flight' => $item->decrement('seats_available', $seats),
                'hotel' => $item->decrement('rooms_available', (int) $quote['meta']['rooms']),
            };

            $quote['coupon']?->increment('used_count');

            return $booking;
        });

        $this->notify($booking, 'Votre réservation a bien été enregistrée');

        return $booking->load(['bookable', 'travelers', 'payments', 'coupon']);
    }

    public function notify(Booking $booking, string $subject): void
    {
        try {
            Mail::to($booking->contact_email ?: $booking->user->email)
                ->send(new BookingMail($booking->loadMissing(['bookable', 'user']), $subject));
        } catch (\Throwable $e) {
            // Un problème d'e-mail ne doit jamais bloquer une réservation
            Log::warning('Envoi e-mail réservation impossible : '.$e->getMessage());
        }
    }

    private function ensureSeats(int $available, int $requested): void
    {
        if ($requested > $available) {
            throw ValidationException::withMessages([
                'adults' => $available > 0
                    ? "Il ne reste que {$available} place(s) disponible(s)."
                    : 'Cette offre est complète.',
            ]);
        }
    }
}
