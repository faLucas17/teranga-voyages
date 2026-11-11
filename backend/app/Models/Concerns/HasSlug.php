<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Génère automatiquement un slug unique à partir d'un attribut (name / title).
 */
trait HasSlug
{
    protected static function bootHasSlug(): void
    {
        static::saving(function ($model) {
            $source = $model->slugSource ?? 'name';

            if (empty($model->slug) || $model->isDirty($source) && ! $model->isDirty('slug')) {
                $model->slug = $model->uniqueSlug(Str::slug((string) $model->{$source}));
            }
        });
    }

    protected function uniqueSlug(string $base): string
    {
        $base = $base !== '' ? $base : Str::lower(Str::random(8));
        $slug = $base;
        $i = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($this->exists, fn ($q) => $q->whereKeyNot($this->getKey()))
            ->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
