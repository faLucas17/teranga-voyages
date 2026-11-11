<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Forfait / voyage organisé (séjour, circuit, pèlerinage, safari...).
 */
class TravelPackage extends Model
{
    use HasSlug;

    protected string $slugSource = 'title';

    public const TYPES = ['sejour', 'circuit', 'pelerinage', 'safari', 'croisiere', 'weekend'];

    protected $fillable = [
        'destination_id', 'title', 'slug', 'type', 'summary', 'description',
        'itinerary', 'included', 'excluded', 'gallery', 'cover_image',
        'duration_days', 'departure_city', 'start_date', 'end_date',
        'price', 'child_price', 'seats_total', 'seats_available',
        'is_featured', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'itinerary' => 'array',
            'included' => 'array',
            'excluded' => 'array',
            'gallery' => 'array',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'price' => 'integer',
            'child_price' => 'integer',
            'seats_total' => 'integer',
            'seats_available' => 'integer',
            'duration_days' => 'integer',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->reviews()->where('is_approved', true);
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function effectiveChildPrice(): int
    {
        return (int) ($this->child_price ?? $this->price);
    }
}
