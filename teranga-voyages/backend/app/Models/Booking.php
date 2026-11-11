<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Booking extends Model
{
    public const STATUS_PENDING = 'pending';     // en attente de paiement
    public const STATUS_CONFIRMED = 'confirmed'; // confirmée par l'agence (paiement sur place / virement)
    public const STATUS_PAID = 'paid';           // payée
    public const STATUS_CANCELLED = 'cancelled'; // annulée
    public const STATUS_COMPLETED = 'completed'; // voyage effectué

    public const STATUSES = [
        self::STATUS_PENDING, self::STATUS_CONFIRMED, self::STATUS_PAID,
        self::STATUS_CANCELLED, self::STATUS_COMPLETED,
    ];

    protected $fillable = [
        'reference', 'user_id', 'bookable_type', 'bookable_id', 'start_date', 'end_date',
        'adults', 'children', 'subtotal', 'discount', 'total', 'currency', 'status',
        'coupon_id', 'contact_name', 'contact_email', 'contact_phone',
        'special_requests', 'meta', 'admin_notes', 'cancelled_at', 'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'adults' => 'integer',
            'children' => 'integer',
            'subtotal' => 'integer',
            'discount' => 'integer',
            'total' => 'integer',
            'meta' => 'array',
            'cancelled_at' => 'datetime',
        ];
    }

    protected $appends = ['amount_paid', 'balance_due', 'kind'];

    protected static function booted(): void
    {
        static::creating(function (Booking $booking) {
            $booking->reference ??= static::generateReference();
        });
    }

    public static function generateReference(): string
    {
        do {
            $ref = config('agency.booking_prefix', 'TV').'-'.now()->format('ym').'-'.Str::upper(Str::random(6));
        } while (static::where('reference', $ref)->exists());

        return $ref;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookable(): MorphTo
    {
        return $this->morphTo();
    }

    public function travelers(): HasMany
    {
        return $this->hasMany(Traveler::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function getKindAttribute(): string
    {
        return $this->bookable_type; // package | hotel | flight (morph map)
    }

    public function getAmountPaidAttribute(): int
    {
        if ($this->relationLoaded('payments')) {
            return (int) $this->payments->where('status', Payment::STATUS_SUCCEEDED)->sum('amount');
        }

        return (int) $this->payments()->where('status', Payment::STATUS_SUCCEEDED)->sum('amount');
    }

    public function getBalanceDueAttribute(): int
    {
        return max(0, $this->total - $this->amount_paid);
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED], true);
    }

    public function isPayable(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED], true)
            && $this->balance_due > 0;
    }

    /**
     * Annule la réservation et libère les places réservées.
     */
    public function cancel(?string $reason = null): void
    {
        if ($this->status === self::STATUS_CANCELLED) {
            return;
        }

        DB::transaction(function () use ($reason) {
            $bookable = $this->bookable()->lockForUpdate()->first();
            $seats = $this->adults + $this->children;

            if ($bookable instanceof TravelPackage || $bookable instanceof Flight) {
                $bookable->increment('seats_available', $seats);
            } elseif ($bookable instanceof Hotel) {
                $bookable->increment('rooms_available', (int) ($this->meta['rooms'] ?? 1));
            }

            if ($this->coupon_id) {
                Coupon::whereKey($this->coupon_id)->where('used_count', '>', 0)->decrement('used_count');
            }

            $this->update([
                'status' => self::STATUS_CANCELLED,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
            ]);
        });
    }
}
