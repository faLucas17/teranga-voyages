<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Paramètres clé/valeur de l'agence (nom, téléphone, réseaux sociaux...).
 */
class Setting extends Model
{
    protected $fillable = ['key', 'value', 'is_public'];

    protected function casts(): array
    {
        return ['is_public' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget('settings.public'));
        static::deleted(fn () => Cache::forget('settings.public'));
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function putValue(string $key, mixed $value, bool $public = true): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value, 'is_public' => $public]);
    }

    public static function publicMap(): array
    {
        return Cache::remember('settings.public', 3600, fn () => static::where('is_public', true)
            ->pluck('value', 'key')
            ->toArray());
    }
}
