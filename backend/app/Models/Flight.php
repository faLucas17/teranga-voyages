<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Flight extends Model
{
    public const CLASSES = ['economy', 'premium', 'business', 'first'];

    protected $fillable = [
        'airline', 'flight_number', 'from_city', 'from_code', 'to_city', 'to_code',
        'departure_at', 'arrival_at', 'cabin_class', 'price', 'seats_available',
        'baggage', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'departure_at' => 'datetime',
            'arrival_at' => 'datetime',
            'price' => 'integer',
            'seats_available' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected $appends = ['label', 'duration_minutes'];

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function getLabelAttribute(): string
    {
        return "{$this->airline} {$this->flight_number} · {$this->from_code} → {$this->to_code}";
    }

    public function getDurationMinutesAttribute(): ?int
    {
        if (! $this->departure_at || ! $this->arrival_at) {
            return null;
        }

        return (int) $this->departure_at->diffInMinutes($this->arrival_at);
    }
}
