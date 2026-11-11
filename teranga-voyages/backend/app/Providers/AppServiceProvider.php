<?php

namespace App\Providers;

use App\Models\Flight;
use App\Models\Hotel;
use App\Models\TravelPackage;
use App\Models\User;
use App\Services\Payments\PaymentManager;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentManager::class);
    }

    public function boot(): void
    {
        // Noms courts et stables pour les relations polymorphes (bookable_type)
        Relation::enforceMorphMap([
            'package' => TravelPackage::class,
            'hotel' => Hotel::class,
            'flight' => Flight::class,
            'user' => User::class,
        ]);

        JsonResource::withoutWrapping();

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('forms', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
    }
}
