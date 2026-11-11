<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Hotel extends Model
{
    use HasSlug;

    protected string $slugSource = 'name';

    protected $fillable = [
        'destination_id', 'name', 'slug', 'stars', 'address', 'description',
        'amenities', 'image', 'price_per_night', 'rooms_available', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amenities' => 'array',
            'stars' => 'integer',
            'price_per_night' => 'integer',
            'rooms_available' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }

    public function bookings(): MorphMany
    {
        return $this->morphMany(Booking::class, 'bookable');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
