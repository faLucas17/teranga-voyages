<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'description', 'type', 'value', 'min_amount', 'max_uses',
        'used_count', 'expires_at', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'min_amount' => 'integer',
            'max_uses' => 'integer',
            'used_count' => 'integer',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    protected function code(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            set: fn ($value) => strtoupper(trim((string) $value)),
        );
    }

    /**
     * Retourne null si le code est valide pour ce montant, sinon le message d'erreur.
     */
    public function validationError(int $amount): ?string
    {
        if (! $this->is_active) {
            return 'Ce code promo est désactivé.';
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return 'Ce code promo a expiré.';
        }
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return "Ce code promo a atteint son nombre maximal d'utilisations.";
        }
        if ($amount < $this->min_amount) {
            return 'Montant minimum requis : '.number_format($this->min_amount, 0, ',', ' ').' '.config('agency.currency');
        }

        return null;
    }

    public function discountFor(int $amount): int
    {
        $discount = $this->type === 'percent'
            ? (int) round($amount * min($this->value, 100) / 100)
            : (int) $this->value;

        return min($discount, $amount);
    }
}
