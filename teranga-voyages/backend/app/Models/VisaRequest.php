<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class VisaRequest extends Model
{
    public const STATUSES = ['received', 'processing', 'approved', 'rejected'];
    public const TYPES = ['tourisme', 'affaires', 'etudes', 'omra', 'hajj', 'transit'];

    protected $fillable = [
        'reference', 'user_id', 'full_name', 'email', 'phone', 'destination_country',
        'visa_type', 'travel_date', 'passport_number', 'message', 'status', 'admin_notes',
    ];

    protected function casts(): array
    {
        return ['travel_date' => 'date:Y-m-d'];
    }

    protected static function booted(): void
    {
        static::creating(function (VisaRequest $visa) {
            $visa->reference ??= 'VISA-'.now()->format('ym').'-'.Str::upper(Str::random(5));
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
